/* jslint node:true, esnext:true, es6:true, browser:true */
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
const
    template = require('core/client/js/template'),
    lackey = require('core/client/js'),
    qs = require('query-string'),
    xhr = require('core/client/js/xhr'),
    growl = require('cms/client/js/growl'),
    api = require('core/client/js/api');

function pushState(href) {
    let loc = document.location,
        url = loc.protocol + '//' + loc.host + loc.pathname + '?' + qs.stringify(href);
    window.history.pushState({}, document.title, url);
}

class Table {

    constructor(element) {
        var
            self = this;
        this._search = lackey.select('[data-lky-hook="table.filter"]')[0];
        this._sort = lackey.select('[data-lky-hook="table.sort"]')[0];
        this._root = element;
        this._paging = JSON.parse(element.getAttribute('data-lky-paging'));
        this._columns = JSON.parse(element.getAttribute('data-lky-columns'));
        this._apiEndpoint = element.getAttribute('data-lky-table');
        this.paging();
        this.pageNumber = 0;

        let waiting = null;

        if (this._sort) {
            this._sort
                .addEventListener('change', () => {
                    self.query({
                        q: this._search.value
                    });
                });
        }

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

        if (document.location.search && document.location.search.length) {
            self.query(qs.parse(document.location.search), true);
        } else {
            this.api();
        }

        window.addEventListener('popstate', () => {
            self.query(qs.parse(document.location.search), true);
            return true;
        });
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
                                self.page(self.pageNumber);
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
        let self = this;
        this
            .query(lackey.merge({
                q: this._search.value
            }, {
                page: pageNumber
            }))
            .then(() => {
                self.pageNumber = pageNumber;
            });
    }

    query(options, dontPushState) {

        let self = this,
            path = this._apiEndpoint,
            query = options || {},
            href = options || {},
            context,
            handler,
            sort = options.sort ? options.sort : (this._sort ? (this._sort.value || null) : null);

        if (self.locked) {
            return;
        }

        if (sort) {
            query.sort = sort;
            href.sort = sort;
        }

        query.format = 'table';

        path += '?' + qs.stringify(query);

        return new Promise((resolve, reject) => {

            handler = () => {
                self._root.removeEventListener('transitionend', handler, false);
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
                        self._root.removeAttribute('data-lky-busy');
                    })
                    .then(() => {
                        self.locked = true;
                        self._search.value = href.q || '';
                        if (self._sort) {
                            self._sort.value = href.sort || null;
                        }
                        self.locked = false;
                        if (dontPushState) {
                            return;
                        }
                        pushState(href);

                    })
                    .then(resolve, reject);
            };

            self._root.addEventListener('transitionend', handler, false);
            self._root.setAttribute('data-lky-busy', '');

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
