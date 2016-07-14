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
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/taxonomy';

SCli.debug(__MODULE_NAME, 'REQUIRED');

module.exports = SUtils
    .waitForAs(__MODULE_NAME,
        SUtils.cmsMod('core').model('objection'),
        require('../taxonomy-type'),
        require('../knex')
    )
    .then((ObjectionWrapper, TaxonomyType) => {

        SCli.debug(__MODULE_NAME, 'READY');

        class TaxonomyModel extends Model {
            static get tableName() {
                return 'taxonomy';
            }
        }


        /**
         * @class
         */
        class Taxonomy extends ObjectionWrapper {

            static get api() {
                return '/cms/taxonomy';
            }


            static get model() {
                return TaxonomyModel;
            }

            get label() {
                return this._doc.label;
            }

            get type() {
                return this._type;
            }

            _populate() {
                let self = this;
                if (!this._doc) {
                    return Promise.resolve(this);
                }
                return TaxonomyType
                    .findById(this._doc.taxonomyTypeId)
                    .then((type) => {
                        self._type = type;
                        return self;
                    });

            }

            _preSave() {
                if (this._doc) {
                    if (this._doc.type) {
                        this._doc.taxonomyTypeId = this._doc.type;
                        delete this._doc.type;
                    }
                }
                return Promise.resolve(this);
            }

            toJSON() {
                return {
                    id: this.id,
                    name: this._doc.name,
                    label: this._doc.label,
                    type: this.type ? this.type.toJSON() : null
                };
            }

            static byTypeAndParam(type, paramName, paramValue) {
                let self = this,
                    query = {
                        type: type
                    };
                query[paramName] = paramValue;
                return this._preQuery(query)
                    .then((q) => {
                        query = q;
                        let cursor = TaxonomyModel.query();
                        Object.keys(query).forEach((key) => {
                            cursor = cursor.where(key, query[key]);
                        });
                        return SCli.sql(cursor);
                    })
                    .then((list) => {
                        if (list.length > 0) {
                            return (new Taxonomy(list[0]))._populate();
                        }
                        if (!query.name) {
                            query.name = query.label.replace(/[^a-zA-Z0-9_-]+/g, '_');
                            return self.unique(query.type, query.name)
                                .then((name) => {
                                    query.name = name;
                                    return self.create(query);
                                });
                        }
                        return self.create(query);
                    });
            }

            static unique(type, name, incrementor) {
                let self = this,
                    inc = incrementor === undefined ? 0 : incrementor,
                    nameValue = inc > 1 ? name + '-' + inc : name;

                return SCli.sql(TaxonomyModel
                        .query()
                        .count()
                        .where('taxonomyTypeId', type)
                        .where('name', nameValue))
                    .then((count) => {
                        if (+count[0].count === 0) {
                            return nameValue;
                        }
                        return self.unique(type, name, inc + 1);
                    });

            }

            static byTypeAndLabel(type, label) {
                return this.byTypeAndParam(type, 'label', label);
            }

            static byTypeAndName(type, name) {
                return this.byTypeAndParam(type, 'name', name);
            }

            static _preQuery(query) {

                let promise = Promise.resolve(query);
                if (query.type) {
                    promise = TaxonomyType.query({
                            name: query.type
                        })
                        .then((types) => {
                            if (types && types.length) {
                                query.taxonomyTypeId = types[0].id;
                            } else {
                                console.error('Taxonomy Type not found ' + query.type);
                            }
                            delete query.type;
                            return query;

                        });
                }
                if (query.restrictive === '0' || query.restrictive === '1') {
                    let innerQuery = {
                        restrictive: true
                    };
                    if (query.restrictive !== '1') {
                        innerQuery = {
                            $or: [{
                                restrictive: null
                            }, {
                                restrictive: false
                            }]
                        };
                    }
                    promise = TaxonomyType.query(innerQuery)
                        .then((types) => {
                            query.taxonomyTypeId = {
                                $in: types.map((type) => type.id)
                            };
                            delete query.restrictive;
                            return query;
                        });
                }

                return promise;

            }

            static getByName(name) {
                return this.findOneBy('name', name);
            }
        }

        require('./generator');
        return Taxonomy;
    });
