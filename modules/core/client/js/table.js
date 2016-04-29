/* jslint node:true, esnext:true, es6:true */
/* eslint default-case:0 no-alert:0 */
/* global top */
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
const template = require('./template'),
    lackey = require('./index'),
    qs = require('query-string'),
    _ = require('lodash'),
    api = require('../../../cms/client/js/api'); // Todo: should move to core

class Table {

    constructor(element) {
        let self = this;
        this._root = element;
        this._paging = JSON.parse(element.getAttribute('data-lky-paging'));
        this._columns = JSON.parse(element.getAttribute('data-lky-columns'));
        this._apiEndpoint = element.getAttribute('data-lky-table');
        this.paging();
        lackey.bind('[data-lky-hook="filters"] button', 'click', (event) => {
            /* istanbul ignore next */
            self.filter(event, lackey.hook('lky:filters'));
        }, element);
        this.api();
    }

    api() {
        let self = this;
        lackey.bind('[data-lky-api]', 'click', (event, hook) => {
            event.preventDefault();
            let apiAction = hook.getAttribute('data-lky-api').split(':');
            switch (apiAction[0]) {
            case 'DELETE':
                {
                    if (confirm('Are you sure? There is no undo')) {
                        api.delete(apiAction[1])
                            .then(() => {
                                self.page(0);
                            });
                    }
                }
            }
        });
    }

    filter(event, hook) {
        event.stopPropagation();
        event.preventDefault();
        this.query(this.filters(lackey.form(hook)));
    }

    filters(filters) {
        let self = this,
            result = {};


        Object.keys(filters).forEach((key) => {
            if (filters[key] === '') {
                return;
            }
            self._columns.forEach((column) => {

                if (column.name === key) {
                    if (column.like === true) {
                        result[key] = '%' + filters[key] + '%';
                    } else if (column.like === 'l') {
                        result[key] = '%' + filters[key];
                    } else if (column.like === 'r') {
                        result[key] = filters[key] + '%';
                    } else {
                        result[key] = filters[key];
                        return result[key];
                    }
                }
            });
        });
        return result;
    }

    page(pageNumber) {
        this.query(_.merge(this.filters(lackey.form(lackey.hook('filters', this._root))), {
            offset: pageNumber * this._paging.perPage,
            limit: this._paging.perPage
        }));
    }

    query(options) {
        let self = this,
            path = this._apiEndpoint,
            query = options || {};

        if (!query.offset) {
            query.offset = 0;
        }

        if (!options.limit) {
            query.limit = this._paging.perPage;
        }

        query.format = 'table';

        path += '?' + qs.stringify(query);

        api.read(path).then((response) => {

            response.rows.map((row) => {
                let columns = [];
                self._columns.forEach((column) => {
                    let value = row[column.name];
                    if (column.parse) {
                        let parse = new Function('val', column.parse); //eslint-disable-line no-new-func
                        value = parse(value);
                    }
                    columns.push({
                        value: value
                    });
                });
                return {
                    columns: columns
                };
            });

            let context = {
                table: response
            };
            self.drawRows(context)
                .then(() => {
                    self.api();
                });
            self.drawPaging(context);
        });
    }

    drawPaging(context) {
        let body = lackey.hook('table-footer', this._root),
            self = this;
        body.innerHTML = '';

        return template.render(body.getAttribute('data-lky-template'), context).then((rows) => {
            rows.forEach((row) => {
                body.appendChild(row);
                self.paging(row);

            });
        });
    }

    drawRows(context) {
        let body = lackey.hook('table-body', this._root);
        body.innerHTML = '';

        return template.render(body.getAttribute('data-lky-template'), context).then((rows) => {
            rows.forEach((row) => {
                body.appendChild(row);
            });
        });
    }

    get pagingArea() {
        return lackey.hook('table-footer', this._root);
    }

    paging(area) {
        let self = this;
        lackey.bind('lky:table-paging', 'click', (event, hook) => {
            event.stopPropagation();
            event.preventDefault();
            self.page(hook.getAttribute('data-page'));
            return false;
        }, area || this.pagingArea);
    }

    static init() {
        return lackey.getWithAttribute('data-lky-table').map((element) => {
            return new Table(element);
        });
    }
}

module.exports = Table;
