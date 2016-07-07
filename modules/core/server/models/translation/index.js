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
    SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    Model = objection.Model,
    SCli = require(LACKEY_PATH).cli,
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/session',
    KNEX = require('../knex');

SCli.debug(__MODULE_NAME, 'REQUIRED');

module.exports = SUtils
    .waitForAs(
        __MODULE_NAME,
        SUtils.cmsMod('core').model('objection'),
        KNEX
    )
    .then((ObjectionWrapper) => {
        SCli.debug(__MODULE_NAME, 'READY');

        class TranslationModel extends Model {
            static get tableName() {
                return 'translations';
            }
        }

        class Translation extends ObjectionWrapper {

            static get api() {
                return '/cms/translation';
            }

            static get model() {
                return TranslationModel;
            }

            static findById(id) {
                SCli.debug(__MODULE_NAME, 'findById', this.model.tableName, id);
                if (!id) {
                    return Promise.resolve(null);
                }
                return this.findOneBy('id', id);
            }

            static getTranslation(ref, locale, content) {
                let Self = this;
                SCli.debug(__MODULE_NAME, 'findTranslation', this.model.tableName, ref, locale);
                if (!ref) {
                    return Promise.resolve(null);
                }
                return SCli
                    .sql(this.model
                        .query()
                        .where('reference', ref)
                        .where('language', locale)
                    )
                    .then((result) => {
                        if (!result || !result.length) {
                            return Self.create({
                                reference: ref,
                                language: locale,
                                originalValue: content
                            });
                        }
                        return Self.factory(result[0]);
                    }, () => {
                        return null;
                    });
            }

            toJSON() {
                return {
                    id: this._doc.id,
                    origionalContent: this._doc.origionalContent,
                    language: this._doc.language,
                    value: this._doc.value
                };
            }


        }

        return Translation;
    });
