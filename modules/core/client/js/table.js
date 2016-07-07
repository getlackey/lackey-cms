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
const template = require('core/client/js/template'),
    lackey = require('core/client/js'),
    qs = require('query-string'),
    xhr = require('core/client/js/xhr'),
    api = require('core/client/js/api');

class Table {

    constructor(element) {
        let
            self = this,
            input = lackey.select('[data-lky-hook="table.filter"]')[0];
        this._root = element;
        this._paging = JSON.parse(element.getAttribute('data-lky-paging'));
        this._columns = JSON.parse(element.getAttribute('data-lky-columns'));
        this._apiEndpoint = element.getAttribute('data-lky-table');
        this.paging();
        let waiting = null;
        input
            .addEventListener('keyup', () => {
                /* istanbul ignore next */
                if (waiting) {
                    clearTimeout(waiting);
                }

                waiting = setTimeout(() => {
                    clearTimeout(waiting);
                    waiting = null;
                    self.query({
                        q: input.value
                    });
                }, 500);
            });
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
        this.query(lackey.merge(this.filters(lackey.form(lackey.hook('filters', this._root))), {
            page: pageNumber
        }));
    }

    query(options) {
        let self = this,
            path = this._apiEndpoint,
            query = options || {},
            context,
            handler;

        query.format = 'table';

        path += '?' + qs.stringify(query);

        handler = () => {
            this._root.removeEventListener('transitionend', handler, false);
            api
                .read(path)
                .then((response) => {

                    response.rows.map((row) => {
                        let columns = [];
                        self._columns.forEach((column) => {
                            let value = row[column.name];
                            if (column.parse) {
                                let parse = new Function('val', column.parse); //eslint-disable-line no-new-func
                                value = parse(value);
                            }

                            if (value && column.link) {
                                value = {
                                    href: value,
                                    label: column.linkText || value
                                };
                            }

                            if (value && column.date) {
                                value = {
                                    date: value
                                };
                            }

                            if (Array.isArray(value)) {
                                value = value.join(', ');
                            }

                            columns.push({
                                value: value
                            });
                        });
                        return {
                            columns: columns
                        };
                    });

                    context = {
                        table: response,
                        host: xhr.base
                    };
                    return self.drawRows(context);
                })
                .then(() => {
                    self.api();
                })
                .then(() => {
                    self.drawPaging(context);
                })
                .then(() => {
                    this._root.removeAttribute('data-lky-busy');
                });
        };

        this._root.addEventListener('transitionend', handler, false);
        this._root.setAttribute('data-lky-busy', '');


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
            self.page(hook.getAttribute('data-page') - 1);
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
