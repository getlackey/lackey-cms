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

const
    DataSources = require(LACKEY_PATH).datasources,
    SCli = require(LACKEY_PATH).cli,
    Database = DataSources.get('knex', 'default'),
    objection = require('objection'),
    _ = require('lodash'),
    Model = objection.Model;

class ObjectionModel extends Model {

    static get tableName() {
        return 'objection';
    }

}

function handleError(outerError, instance) {
    return function (error, silent) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'ERROR', error.message);
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'ERROR', outerError.stack);
        console.error(error);
        console.error(outerError.stack);
        if (instance) {
            console.error(instance);
        }
        if (silent) {
            throw error;
        }
        return error;
    };
}

class ObjectionWrapper {

    constructor(data) {
        this._doc = data || {};
    }

    toJSON() {
        return JSON.parse(JSON.stringify(this._doc));
    }

    save(options) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'save', this.constructor.model.tableName);
        let self = this,
            hook = new Error(),
            cached = _.cloneDeep(this._doc);

        return this._preSave(options)
            .then(() => {
                return self._filter();
            })
            .then(() => {
                if (!self._doc.id) {
                    return SCli.sql(self.constructor.model
                        .query()
                        .insertAndFetch(self._doc)
                    ).then((result) => {
                        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'created', self.constructor.model.tableName);
                        return result;

                    }, handleError(new Error(), self));
                }
                self._doc.updatedAt = new Date();
                return SCli.sql(self.constructor.model
                    .query()
                    .updateAndFetchById(self.id, self._doc)
                ).then((result) => {
                    SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'saved', self.constructor.model.tableName);
                    return result;
                }, handleError(hook, self));
            })
            .then((data) => {
                self._doc = data;
                return self._postSave(cached);
            }).then(() => {
                return self._populate();
            });
    }

    get id() {
        return this._doc.id || null;
    }

    get name() {
        return this._doc.name;
    }

    set name(name) {
        this._doc.name = name;
    }

    get createdAt() {
        return this._doc.createdAt;
    }

    get updatedAt() {
        return this._doc.updatedAt;
    }

    set createdAt(value) {
        this._doc.createdAt = value;
    }

    set updatedAt(value) {
        this._doc.updatedAt = value;
    }

    _populate() {
        this._populated = true;
        return Promise.resolve(this);
    }

    _preSave() {
        return Promise.resolve(this);
    }

    _filter() {
        return Promise.resolve(this);
    }

    _postSave() {
        return Promise.resolve(this);
    }

    diff(data) {
        let self = this;
        _.merge(self._doc, data);
        return true;
    }

    update(data) {
        if (this.diff(data)) {
            return this.save();
        }
        return Promise.resovle(this);
    }

    static get model() {
        return ObjectionModel;
    }

    /**
     * Creates instance
     * @param   {Mixed} data
     * @returns {Promise} of instance
     */
    static create(data) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'create', this.model.tableName, JSON.stringify(data));
        let Self = this;
        return (new Self(data)).save();
    }

    /**
     * Gets instance by id
     * @param   {Number|String} id
     * @returns {Promise} of instance or null
     */
    static findById(id) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'findById', this.model.tableName, id);
        if (!id) {
            return Promise.resolve(null);
        }
        if (isNaN(id)) {
            return Promise.reject();
        }
        return this.findOneBy('id', id);
    }

    /**
     * Gets instance by id
     * @param   {Number|String} id
     * @returns {Promise} of instance or null
     */
    static findBy(field, value) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'findBy', this.model.tableName, field, value);
        let Self = this,
            hook = new Error();
        return SCli.sql(this.model
            .query()
            .where(field, value)
        ).then((result) => {
            SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'findBy', this.model.tableName, JSON.stringify(result));
            return Promise.all(result.map((data) => Self.factory(data)));
        }, (err) => {
            handleError(hook)(err, true);
            return null;
        });
    }

    /**
     * Gets instance by id
     * @param   {Number|String} id
     * @returns {Promise} of instance or null
     */
    static findOneBy(field, value) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'findOneBy', this.model.tableName, field, value);
        let Self = this,
            hook = new Error();
        return SCli.sql(this.model
            .query()
            .where(field, value)
        ).then((result) => {
            if (!result || !result.length) {
                return null;
            }
            SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'findOneBy', this.model.tableName, JSON.stringify(result[0]));
            return Self.factory(result[0]);
        }, (err) => {
            handleError(hook)(err, true);
            return null;
        });
    }

    static findByIds(ids) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'findByIds', this.model.tableName, ids);

        if (!ids || !ids.length) {
            return Promise.resolve([]);
        }

        let Self = this,
            hook = new Error();
        return SCli.sql(this.model
            .query()
            .whereIn('id', ids)
        ).then((result) => {
            if (!result) {
                return null;
            }
            return Promise.all(result.map((data) => Self.factory(data)));
        }, handleError(hook));
    }

    /**
     * Gets all objects from table (be sure you want to use it)
     * @returns {Promise} of array of instances
     */
    static find() {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'find', this.model.tableName);
        let Self = this;
        return SCli.sql(this.model
            .query()
        ).then((results) => {
            return Promise.all(results.map((result) => Self.factory(result)));
        }, handleError(new Error()));
    }

    static factory(data) {
        return (new this(data))._populate();
    }

    static list() {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'list', this.model.tableName);
        return this.find();
    }

    static where(cursor, query, operand) {
        let cur = cursor,
            self = this,
            fn = operand === 'or' ? 'orWhere' : 'where';
        Object.keys(query).forEach((key) => {

            if (key === '$or') {
                cur = cur.andWhere(function () {
                    let self2 = this;
                    query.$or.forEach((condition, index) => {
                        if (index === 0) {
                            self2 = self.where(self2, condition);
                        } else {
                            self2 = self.where(self2, condition, 'or');
                        }
                    });
                });
            } else if (typeof query[key] === 'object') {
                cur = cur[fn](key, query[key].operator, query[key].value);
            } else {
                cur = cur[fn](key, query[key]);
            }
        });
        return cur;
    }

    static count(query) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'count', this.model.tableName);
        let cursor = this.model
            .query()
            .count();
        if (query) {
            cursor = this.where(cursor, query);
        }
        return SCli.sql(
            cursor
        ).then((result) => {
            if (result && result.length) {
                return +result[0].count;
            }
            return -1;
        });
    }

    static queryWithCount(query, populate, options) {
        let self = this,
            total;

        if (query) {
            Object.keys(query).forEach((key) => {
                query[key] = self.parseLike(query[key]);
            });
        }

        return self.count(query).then((count) => {
            total = count;
            return self.query(query, populate, options);
        }).then((results) => {
            return {
                paging: {
                    limit: options.limit,
                    offset: options.offset,
                    sort: options.sort,
                    total: total,
                    filters: query
                },
                data: results
            };
        });
    }

    static query(query, populate, options) {
        let self = this;
        return new Promise((resolve, reject) => {
            if (!self.model) {
                return reject('This model doesn\'t supply mongo model reference for shared methods');
            }

            let cursor = self
                .model
                .query();

            if (options) {
                if (options.sort) {
                    Object.keys(options.sort).forEach((key) => {
                        cursor = cursor.orderBy(key, options.sort[key] >= 0 ? 'asc' : 'desc');
                    });
                }
                if (options.offset) {
                    cursor = cursor.offset(options.offset);
                }
                if (options.limit) {
                    cursor = cursor.limit(options.limit);
                }
            }

            cursor = self.where(cursor, query);

            SCli
                .sql(cursor)
                .then((documents) => {
                    Promise.all(documents.map((doc) => {
                        return Promise.resolve(self.factory(doc));
                    })).then((docs) => {
                        resolve(docs);
                    }, (err) => {
                        reject(err);
                    });
                });
        });
    }

    static parseLike(value) {
        if (!value || !value.match) return value;
        let matches = value.match(/^(%|)([^%]+)(|%)$/);
        if (matches) {
            if (matches[1] === '%' && matches[3] === '%') {
                return new RegExp(matches[2]);
            } else if (matches[3] === '%') {
                return new RegExp(matches[2] + '$');
            } else if (matches[1] === '%') {
                return new RegExp('^' + matches[2]);
            }
        }
        return value;
    }

    static _preQuery(query) {
        return Promise.resolve(query);
    }

    /**
     * Generates table data
     * @param   {[[Type]]} inputQuery   [[Description]]
     * @param   {Array}    columns [[Description]]
     * @param   {object}   options [[Description]]
     * @returns {[[Type]]} [[Description]]
     */
    static table(inputQuery, columns, options) {

        let
            query,
            self = this,
            columnsList = columns,
            perPage = (options ? options.perPage : false) || 10,
            page = (options ? options.page : false) || 0,
            sort = (options ? options.sort : null),
            populate = null,
            table = {};

        if (!sort) {
            sort = {
                id: 1
            };
        }

        if (columnsList) {
            populate = {};
            Object.keys(columnsList).forEach((column) => {
                if (typeof columnsList[column] === 'number') {
                    populate[column] = columnsList[column];
                } else {
                    populate[column] = 1;
                }
            });
        }

        return this._preQuery(inputQuery, options)
            .then((q) => {
                query = q;
                return this.count(inputQuery);
            }).then((count) => {

                if (options) {
                    if (options.limit) {
                        perPage = options.limit;
                    }

                    if (options.offset) {
                        page = Math.floor(options.offset / perPage) - 1;
                    }

                }

                table.paging = {
                    total: count,
                    pages: Math.ceil(count / perPage),
                    page: page + 1,
                    perPage: perPage,
                    offset: page * perPage,
                    filters: query,
                    api: self.api
                };

                if (sort) {
                    table.paging.sort = sort;
                }

                let queryOptions = {
                    offset: (options && options.offset !== undefined) ? options.offset : table.paging.offset,
                    limit: (options && options.limit !== undefined) ? options.limit : table.paging.perPage
                };

                if (sort) {
                    queryOptions.sort = sort;
                }

                if (options && options.textSearch) {
                    queryOptions.textSearch = options.textSearch;
                }

                return this.query(query, populate, queryOptions);
            }).then((data) => {

                let rows = data.map((content) => {
                    return content.toJSON();
                });

                if (!columnsList) {
                    columnsList = {};
                    rows.forEach((row) => {
                        Object.keys(row).forEach((field) => {
                            columnsList[field] = {};
                        });
                    });
                }

                Object.keys(columnsList).forEach((column) => {
                    let def = columnsList[column];
                    if (typeof def === 'string') {
                        def = columnsList[column] = {
                            label: def
                        };
                    } else if (typeof def === 'number') {
                        if (def === -1) {
                            delete columnsList[column];
                            return;
                        } else {
                            def = columnsList[column] = {
                                label: column
                            };
                        }
                    }
                    def.label = def.label || column;
                    def.name = column;
                    def.type = def.type || 'string';
                });

                rows = rows.map((row) => {
                    let formatted;
                    if (options && options.format === 'table') {
                        formatted = {
                            id: row.id,
                            columns: []
                        };
                        Object.keys(columnsList).forEach((column) => {
                            let value = row[column],
                                parse;
                            if (columnsList[column].parse) {
                                parse = new Function('val', columnsList[column].parse); //eslint-disable-line no-new-func
                                value = parse(value);
                            }

                            if (value !== undefined) {
                                formatted.columns.push({
                                    value: value
                                });
                            } else {
                                formatted.columns.push({});
                            }

                        });

                    } else {
                        formatted = row;
                    }

                    return formatted;
                });

                let newColumns = [];
                Object.keys(columnsList).forEach((column) => {
                    if (columnsList[column].parse) {
                        columnsList[column].parse = columnsList[column].parse.toString();
                    }
                    newColumns.push(columnsList[column]);
                });
                if (options && options.format === 'table') {
                    table.columns = newColumns;
                    table.rows = rows;
                } else {
                    table.data = rows;
                }

                return table;
            });

    }


    ////

    /**
     * Removes all rows,
     * @returns {Promise} of number of delete rows
     */
    static removeAll() {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'removeAll', this.model.tableName);
        let hook = new Error();
        return SCli.sql(this.model
            .query()
            .delete()
        ).catch(handleError(hook));
    }

    bind(fn, args) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'bind');
        let self = this;
        return function () {
            SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'bound');
            return fn.apply(self, args);
        };
    }

    bindCapture(fn) {
        SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'bindCapture');
        let self = this;
        return function () {
            SCli.debug('lackey-cms/modules/core/server/models/objeciton', 'bound and captured');
            let args = [].slice.call(arguments);
            return fn.apply(self, args);
        };
    }

}

module.exports = Database
    .then((knex) => {
        return knex
            .schema.dropTableIfExists('objection')
            .then(() => {
                return knex.schema.createTableIfNotExists('objection', (table) => {
                    table.increments('id').primary();
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                    table.string('name');
                });
            })
            .then(() => {
                return ObjectionWrapper;
            });
    });
