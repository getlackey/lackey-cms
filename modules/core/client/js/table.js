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
    growl = require('cms/client/js/growl'),
    api = require('core/client/js/api');

class Table {

    constructor(element) {
        let
            self = this;
        this._search = lackey.select('[data-lky-hook="table.filter"]')[0];
        this._sort = lackey.select('[data-lky-hook="table.sort"]')[0];
        this._root = element;
        this._paging = JSON.parse(element.getAttribute('data-lky-paging'));
        this._columns = JSON.parse(element.getAttribute('data-lky-columns'));
        this._apiEndpoint = element.getAttribute('data-lky-table');
        this._sorting = lackey.select('[data-lky-hook="table.sort"]')[0];
        this.paging();

        let waiting = null;

        this._sort
            .addEventListener('change', () => {
                self.query({
                    q: this._search.value
                });
            });

        this._search
            .addEventListener('keyup', () => {
                /* istanbul ignore next */
                if (waiting) {
                    clearTimeout(waiting);
                }

                waiting = setTimeout(() => {
                    clearTimeout(waiting);
                    waiting = null;
                    self.query({
                        q: this._search.value
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
                        api
                            .delete(apiAction[1])
                            .then(() => {
                                self.page(0);
                            }, error => {
                                growl({
                                    status: 'error',
                                    message: error.message || error.toString()
                                });
                            });
                    }
                }
            }
        });
    }

    page(pageNumber) {
        this.query(lackey.merge({
            q: this._search.value
        }, {
            page: pageNumber
        }));
    }

    query(options) {
        let self = this,
            path = this._apiEndpoint,
            query = options || {},
            context,
            handler,
            sort = this._sort.value || null;

        if (sort) {
            query.sort = sort;
        }

        query.format = 'table';

        console.log(query);

        path += '?' + qs.stringify(query);

        handler = () => {
            this._root.removeEventListener('transitionend', handler, false);
            api
                .read(path)
                .then((response) => {
                    context = {
                        table: response,
                        host: xhr.base
                    };
                    response.rows.forEach(row =>
                        row.columns.forEach((cell) => {
                            if (cell.value && cell.value.date) {
                                cell.value.date = new Date(cell.value.date);
                            }
                        }));
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
