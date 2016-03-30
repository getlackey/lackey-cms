/* jslint esnext:true, node:true */
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

const SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    Model = objection.Model;


module.exports = SUtils.deps(
    SUtils.cmsMod('core').model('objection'),
    require('./knex')
).promised((ObjectionWrapper) => {

    class TaxonomyTypeModel extends Model {
        static get tableName() {
            return 'taxonomyType';
        }
    }

    /**
     * @class
     */
    class TaxonomyType extends ObjectionWrapper {

        static get api() {
            return '/cms/taxonomy-type';
        }


        static get model() {
            return TaxonomyTypeModel;
        }

        get name() {
            return this._doc.name;
        }

        get label() {
            return this._doc.label;
        }

        toJSON() {
            return {
                id: this.id,
                name: this._doc.name,
                label: this._doc.label
            };
        }

        static getByName(name) {
            return this.findOneBy('name', name);
        }
    }

    require('./generator');
    return TaxonomyType;
});
