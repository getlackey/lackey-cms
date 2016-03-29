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
    SCli = require(LACKEY_PATH).cli,
    objection = require('objection'),
    Model = objection.Model;


module.exports = SUtils.deps(
    SUtils.cmsMod('core').model('objection'),
    require('../taxonomy-type'),
    require('./knex')
).promised((ObjectionWrapper, TaxonomyType) => {

    class TaxonomyModel extends Model {
        static get tableName() {
            return 'taxonomy';
        }
    }


    /**
     * @class
     */
    class Taxonomy extends ObjectionWrapper {

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
            if (!this._doc) return Promise.resolve(this);
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
                type: this.type.toJSON()
            };
        }

        static byTypeAndParam(type, paramName, paramValue) {
            let self = this,
                query = {
                    type: type
                };
            query[paramName] = paramValue;
            return this.translateQueryFileds(query)
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

        static translateQueryFileds(query) {
            return super.translateQueryFileds(query)
                .then((q) => {
                    let promise = Promise.resolve(q);
                    if (q.type) {
                        promise = promise.then((q2) => {
                            return TaxonomyType.query({
                                name: q2.type
                            }).then((types) => {
                                delete q2.type;
                                if (types && types.length) {
                                    q2.taxonomyTypeId = types[0].id;
                                }
                                return q2;
                            });
                        });
                    }
                    return promise;
                });
        }

        static getByName(name) {
            return this.findOneBy('name', name);
        }
    }

    require('./generator');
    return Taxonomy;
});
