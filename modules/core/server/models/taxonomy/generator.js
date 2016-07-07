/* eslint no-underscore-dangle:0 */
/* jslint node:true, esnext:true */
/* globals LACKEY_PATH */
'use strict';

/*
    Copyright 2016 Enigma Marketing Services Limited

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

const SCli = require(LACKEY_PATH).cli,
    Generator = require(LACKEY_PATH).generator;


function getTaxonomyType(data) {
    return require('../taxonomy-type/generator')(data);
}

module.exports = (data) => {
    return require('./index')
        .then((Taxonomy) => {

            if (typeof data === 'string') {
                SCli.debug('lackey/modules/cms/server/models/taxonomy/generator', 'Gets taxonomy ' + data + ' by name');
                throw new Error('no way!');
            }

            function next() {
                SCli.debug('lackey/modules/cms/server/models/taxonomy/generator', 'Ensure that taxonomy  ' + data.name + ' exists');
                return Taxonomy
                    .byTypeAndName(data.type, data.name)
                    .then((tax) => {
                        delete data.type;

                        if (!tax) {
                            return Taxonomy.create(data);
                        }
                        if (Generator.override('Taxonomy') && tax.diff(data)) {
                            return tax.save();
                        }
                        return tax;
                    })
                    .then((tax) => {
                        SCli.debug('lackey/modules/cms/server/models/taxonomy/generator', 'Ensured that taxonomy ' + data.name + ' exists');
                        return tax;
                    });
            }

            if (data.type && !data.type.id) {
                return getTaxonomyType(data.type)
                    .then((type) => {
                        data.taxonomyTypeId = type.id;
                        return next();
                    });

            }
            return next();
        });
};

module.exports.parse = (data) => {

    if (!data.taxonomy && !data.taxonomies) {
        return Promise.resolve(null);
    }
    let taxonomies = [],
        feed = data.taxonomy || data.taxonomies; // back compatibilty

    if (Array.isArray(feed)) {
        return Promise.resolve(feed);
    }
    return Promise.all(Object.keys(feed).map((typeName) => {
            return getTaxonomyType({
                name: typeName
            }).then((taxonomyType) => {
                return Promise
                    .all(feed[typeName]
                        .map((taxonomyName) => {
                            return module.exports({
                                    taxonomyTypeId: taxonomyType.id,
                                    name: taxonomyName
                                })
                                .then((taxonomy) => {
                                    taxonomies.push(taxonomy.id);
                                });
                        }));

            });
        }))
        .then(() => {
            return taxonomies;
        });
};

Generator.registerMapper('Taxonomy', module.exports);
