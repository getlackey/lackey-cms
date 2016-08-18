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

const SUtils = require(LACKEY_PATH).utils,
    SCli = require(LACKEY_PATH).cli,
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/flyweight';


module.exports = SUtils
    .cmsMod('core')
    .model('objection')
    .then(ObjectionWrapper => {

        class Flyweight extends ObjectionWrapper {

            static flightWeightPreload(force) {
                if (force || !this.__flightweight) {
                    SCli.debug(__MODULE_NAME, 'flightWeightPreload', this.model.tableName, force ? 'force' : '');
                    this.__flightweight = this.find();
                }
                return this.__flightweight;
            }

            save(options) {
                let self = this;
                return super
                    .save(options)
                    .then(instance => {
                        return self.constructor
                            .flightWeightPreload(true)
                            .then(() => instance);
                    });
            }

            /**
             * Gets instance by id
             * @param   {Number|String} id
             * @returns {Promise} of instance or null
             */
            static findOneBy(field, value) {
                SCli.debug(__MODULE_NAME, 'findOneBy', this.model.tableName, field, value);
                return this
                    .flightWeightPreload()
                    // SQL has no strict equals
                    /*eslint-disable */
                    .then(list => list.reduce((previous, current) => current[field] == value ? current : previous, null));
                /*eslint-enable */

            }

            /**
             * Gets instance by id
             * @param   {Number|String} id
             * @returns {Promise} of instance or null
             */
            static findBy(field, value) {
                SCli.debug(__MODULE_NAME, 'findBy', this.model.tableName, field, value);
                return this
                    .flightWeightPreload()
                    // SQL has no strict equals
                    /*eslint-disable */
                    .then(list => list.filter(current => current[field] == value));
                /*eslint-enable */
            }


            static findByIds(ids) {
                SCli.debug(__MODULE_NAME, 'findByIds', this.model.tableName, JSON.stringify(ids));
                if (!ids || ids.length === 0) {
                    return [];
                }
                let idsAsInts = ids.map(id => +id);
                return this
                    .flightWeightPreload()
                    .then(list => list.filter(current => idsAsInts.indexOf(+current.id) > -1));
            }
        }

        return Flyweight;
    });
