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

const
    _ = require('lodash'),
    SCli = require(LACKEY_PATH).cli,
    MODULE_NAME = 'lackey-cms/modules/core/server/controllers/crud.injection';

class CRUDInjectionController {

    static get field() {
        throw new Error('You have to override this method');
    }

    static get title() {
        return this._overriden('title', this.field);
    }

    static get actions() {
        return this._overriden('actions', undefined);
    }

    static get tableActions() {
        return this._overriden('tableActions', undefined);
    }

    // columns
    static get tableConfig() {
        return this._overriden('tableConfig', null);
    }

    static get tableOptions() {
        return this._overriden('tableOptions', null);
    }

    static get exportConfig() {
        return this._overriden('exportConfig', null);
    }

    static taxonomyFromQuery(Taxonomy, body) {
        let promise = null;
        if (!body.type) {
            throw new Error('Type required');
        }
        if (body.name) {
            promise = Taxonomy.byTypeAndName(body.type, body.name);
        } else if (body.label) {
            promise = Taxonomy.byTypeAndLabel(body.type, body.label);
        }

        if (!promise) {
            return Promise.reject(new Error('Wrong params'));
        }
        return promise;
    }

    static addTaxonomy(Taxonomy, req, res) {
        let self = this;
        this
            .taxonomyFromQuery(Taxonomy, req.body)
            .then(taxonomy => {
                return req[self.field].addTaxonomy(taxonomy);
            })
            .then(() => {
                return res.api(req[self.field]);
            }, error => {
                console.error(error.message);
                console.error(error.stack);
                return res.error(error);
            });
    }

    static removeTaxonomy(Taxonomy, req, res) {
        let self = this;
        this
            .taxonomyFromQuery(Taxonomy, {
                type: req.taxonomyTypeName,
                name: req.taxonomyName
            })
            .then(taxonomy => {
                return req[self.field].removeTaxonomy(taxonomy);
            })
            .then(() => {
                return res.api(req[self.field]);
            }, error => {
                console.error(error);
                return res.error(error);
            });
    }

    static overrideGetter(field, handler) {
        this.__overrides = this.__overrides || {};
        this.__overrides[field] = this.__overrides[field] || [];
        this.__overrides[field].push(handler);
    }

    static _overriden(field, input) {
        let output = input;
        if (this.__overrides && this.__overrides[field]) {
            this.__overrides[field].forEach(handler => {
                output = handler(output);
            });
        }
        return output;
    }

    static alterQuery(req, query) {
        return query;
    }

    static alterQueryOptions(req, options) {
        return options;
    }

    // ================================================ CRUD
    // Create
    static create(model, req, res) {
        SCli.debug(MODULE_NAME, 'create');
        model
            .create(req.body)
            .then(instance => {
                res.api(instance);
            }, error => {
                console.error(error);
                res.error(req, error);
            });
    }

    // Read
    static read(model, req, res) {
        SCli.debug(MODULE_NAME, 'read');
        if (req.__resFormat === 'yaml' && req[this.field].toYAML) {
            req[this.field]
                .toYAML()
                .then(result => {
                    res.yaml(result);
                });
            return;
        }
        res.api(req[this.field]);
    }

    // Update
    static update(model, req, res) {
        SCli.debug(MODULE_NAME, 'update');
        req[this.field]
            .update(req.body)
            .then(instance => {
                res.api(instance);

            }, error => {
                console.error(error);
                req.error(req, error);
            });
    }

    // Delete
    static delete(model, req, res) {
        SCli.debug(MODULE_NAME, 'remove');
        req[this.field]
            .remove()
            .then(result => {
                res.api(result);
            }, error => {
                req.error(req, error);
            });
    }

    // List
    static list(model, req, res) {
        SCli.debug(MODULE_NAME, 'list');
        let restParams = req.getRESTQuery(true);
        _.merge(restParams.options, {
            keepReference: true
        });
        this
            .__list(model, req, restParams)
            .then(data => {
                res.api(data);
            }, error => {
                res.error(req, error);
            });
    }

    static __list(model, req, options) {
        SCli.debug(MODULE_NAME, '_list');
        let self = this;
        return model
            .table(self.alterQuery(req, options.query), this.tableConfig, self.alterQueryOptions(req, options.options))
            .then(data => {
                if (options.options.format === 'table') {
                    self.mapActions(this.actions, data.columns, data.rows);
                } else if (data.data) {
                    data
                        .data
                        .forEach(row => {
                            delete row.___origial;
                        });
                }
                return data;
            });
    }

    // ById
    static byId(model, req, res, next, id) {
        SCli.debug(MODULE_NAME, 'byId', id);
        let
            self = this;
        model
            .findById(id)
            .then(content => {
                req[self.field] = content;
                next();
            }, error => {
                req.error(req, error);
            });
    }

    // ================================================ /CRUD

    static populateAction(action, row, columns) {
        let
            matches = action.match(/\{.+?\}/g),
            output = action;
        if (matches) {
            matches.forEach(match => {
                if (match === '{id}') {
                    output = action.replace(match, row.id);
                    return;
                }
                let fieldName = match.replace(/^\{|\}$/g, '');
                columns.forEach((column, index) => {
                    if (column.name === fieldName) {
                        output = action.replace(match, row.columns[index].value);
                    }
                });
            });
        }
        return output;
    }

    static mapActions(actions, columns, rows) {
        let
            self = this;
        if (actions && rows) {
            rows.forEach((row) => {
                row.actions = actions.map(_action => {
                    let action = JSON.parse(JSON.stringify(_action));

                    if (!_action.condition || _action.condition(row.___origial)) {
                        if (action.href) {
                            action.href = self.populateAction(action.href, row, columns);
                        } else if (action.api) {
                            action.api = self.populateAction(action.api, row, columns);
                        }
                    } else {
                        action = {};
                    }
                    return action;
                });

            });
        }
        if (rows) {
            rows.forEach(row => {
                delete row.___origial;
            });
        }
    }

    static table(model, req, res) {

        let restParams = req.getRESTQuery(true),
            isExport = req.__resFormat === 'xlsx',
            self = this,
            config,
            tableConfig = isExport && self.exportConfig ? self.exportConfig : self.tableConfig,
            tableOptions = self.tableOptions || {};

        require(LACKEY_PATH)
            .configuration()
            .then(_config => {
                config = _config;
                return model
                    .table(self.alterQuery(req, restParams.query), tableConfig, self.alterQueryOptions(req, _.merge({
                        format: 'table',
                        keepReference: true,
                        nolimit: isExport
                    }, restParams.options)));
            })
            .then(data => {
                if (isExport) {
                    res.send({
                        table: {
                            cols: data.columns.map(column => {
                                return {
                                    caption: column.label,
                                    beforeCellWrite: (row, cellData) => {
                                        return column.date ? cellData.date : cellData;
                                    }
                                };
                            }),
                            rows: data.rows.map(row => row.columns.map(column => column.value !== undefined ? column.value : ''))
                        }
                    });
                    return;
                }
                try {
                    self.mapActions(self.actions, data.columns, data.rows);
                } catch (e) {
                    res.error(e);
                }

                data.rows.forEach(row => { // remove circural
                    delete row.data;
                });
                res.send({
                    title: self.title || self.field,
                    create: model.createLink,
                    tableActions: self.tableActions,
                    tableOptions: tableOptions,
                    template: 'cms/cms/tableview',
                    javascripts: [
                        'js/cms/cms/table.js'
                    ],
                    stylesheets: [
                        'css/cms/cms/table.css'
                    ],
                    host: config.get('host'), // this is so stupid, but fast fix
                    actions: self.actions,
                    data: {
                        table: data
                    }
                });
            }, error => {
                res.error(req, error);
            });
    }

    static method(methodName, param) {
        let self = this;
        if (!param) {
            return (req, res, next) => self[methodName](req, res, next);
        }
        return (req, res, next, id) => self[methodName](req, res, next, id);
    }

}

module.exports = CRUDInjectionController;
