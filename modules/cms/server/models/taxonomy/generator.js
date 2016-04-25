/* eslint no-underscore-dangle:0 */
/* jslint node:true, esnext:true */
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
if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const SCli = require(LACKEY_PATH).cli,
    Generator = require(LACKEY_PATH).generator;

let Taxonomy, taxonomyTypeGenerator;

module.exports = (data) => {
    return require('./index')
        .then((taxonomy) => {
            Taxonomy = taxonomy;
            taxonomyTypeGenerator = require('../taxonomy-type/generator');


            if (typeof data === 'string') {
                SCli.debug('lackey/modules/cms/server/models/taxonomy/generator', 'Gets taxonomy ' + data + ' by name');
                return Taxonomy.getByName(data);
            }

            function next() {
                SCli.debug('lackey/modules/cms/server/models/taxonomy/generator', 'Ensure that taxonomy  ' + data.name + ' exists');
                return Taxonomy.getByName(data.name).then((tax) => {
                    if (!tax) {
                        return Taxonomy.create(data);
                    }
                    if (Generator.override('Taxonomy') && tax.diff(data)) {
                        return tax.save();
                    }
                    return tax;
                }).then((tax) => {
                    SCli.debug('lackey/modules/cms/server/models/taxonomy/generator', 'Ensured that taxonomy ' + data.name + ' exists');
                    return tax;
                });
            }

            if (data.type && !data.type.id) {
                return taxonomyTypeGenerator(data.type).then((type) => {
                    data.taxonomyTypeId = type.id;
                    delete data.type;
                    return next();
                });

            }
            return next();
        });
};

Generator.registerMapper('Taxonomy', module.exports);
