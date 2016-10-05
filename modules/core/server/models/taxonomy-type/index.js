/* jslint esnext:true, node:true */
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


const SUtils = require(LACKEY_PATH).utils,
    SCli = require(LACKEY_PATH).cli,
    objection = require('objection'),
    Model = objection.Model,
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/taxonomy-type';

SCli.debug(__MODULE_NAME, 'REQUIRED');

module.exports = SUtils
    .waitForAs(
        __MODULE_NAME,
        SUtils.cmsMod('core').model('flyweight'),
        SUtils.cmsMod('core').model('knex')
    )
    .then(FlyWeight => {

        SCli.debug(__MODULE_NAME, 'READY');

        class TaxonomyTypeModel extends Model {
            static get tableName() {
                return 'taxonomyType';
            }
        }

        /**
         * @class
         */
        class TaxonomyType extends FlyWeight {

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

            get restrictive() {
                return this._doc.restrictive;
            }

            get description() {
                return this._doc.description;
            }

            get allowCreation() {
                return this._doc.allowCreation;
            }

            toJSON() {
                return {
                    id: this.id,
                    name: this.name,
                    label: this.label,
                    restrictive: this.restrictive,
                    description: this.description,
                    allowCreation: this.allowCreation
                };
            }

            static getByName(name) {
                return this.findOneBy('name', name);
            }
        }

        require('./generator');
        return TaxonomyType;
    });
