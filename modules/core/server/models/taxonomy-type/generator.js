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

const
    SCli = require(LACKEY_PATH).cli,
    Generator = require(LACKEY_PATH).generator;

let TaxonomyType;

module.exports = (data) => {
    return require('./index')
        .then(type => {
            TaxonomyType = type;

            if (typeof data === 'string') {
                SCli.debug('lackey/modules/cms/server/models/taxonomy-type/generator', 'Gets taxonomy type ' + data + ' by name');
                return TaxonomyType.getByName(data);
            }

            SCli.debug('lackey/modules/cms/server/models/taxonomy-type/generator', 'Ensure that taxonomy type ' + data.name + ' exists');
            return TaxonomyType.getByName(data.name);
        })
        .then(type => {
            if (!type) {
                return TaxonomyType.create(data);
            }
            if (Generator.override('TaxonomyType') && typeof data !== 'string' && type.diff(data)) {
                SCli.debug('lackey/modules/cms/server/models/taxonomy-type/generator', 'Override ' + data.name);
                return type.save();
            }
            return type;
        })
        .then(type => {
            SCli.debug('lackey/modules/cms/server/models/taxonomy-type/generator', 'Ensured that taxonomy type ' + data.name + ' exists');
            return type;
        });
};

Generator.registerMapper('TaxonomyType', module.exports);
