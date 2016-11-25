/* jslint node:true, esnext:true, es6:true, browser:true */
/* eslint default-case:0 no-alert:0 */
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

function replaceState(href) {
    let loc = document.location,
        url = loc.protocol + '//' + loc.host + loc.pathname + '?' + qs.stringify(href);
    window.history.replaceState({}, document.title, url);
}

class Table {

    constructor(element) {
        var
            self = this;
        this._search = lackey.select('[data-lky-hook="table.filter"]')[0];
        this._root = element;
        this._initial = JSON.parse(element.getAttribute('data-lky-init'));
        this._paging = JSON.parse(element.getAttribute('data-lky-paging'));
        this._columns = JSON.parse(element.getAttribute('data-lky-columns'));
        this._apiEndpoint = element.getAttribute('data-lky-table');
        this.pageNumber = 0;
        this.sorting();
        this.data = {};
        this.perPage = 10;
        this.filter = '';
        this.ready = false;

        let waiting = null;

        this.initialDraw()
            .then(function () {
                self._search
                    .addEventListener('keyup', () => {
                        /* istanbul ignore next */
                        if (waiting) {
                            clearTimeout(waiting);
                        }

                        self.filter = self._search.value;

                        waiting = setTimeout(() => {
                            clearTimeout(waiting);
                            waiting = null;
                            self.pageq();
                        }, 500);
                    });

                if (document.location.search && document.location.search.length) {
                    self.setProps(qs.parse(document.location.search));
                }
                self.getData()
                    .then(() => {
                        self.ready = true;
                    });
                window.addEventListener('popstate', () => {
                    self.query(qs.parse(document.location.search), true);
                    return true;
                });
            });
    }

    initialDraw() {
        return this.drawRows({
            host: xhr.base,
            table: this._initial
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
            .pageq({
                page: pageNumber
            })
            .then(() => {
                self.pageNumber = pageNumber;
            });
    }

    getData() {
        let self = this,
            total = this._initial.paging.total,
            limit = 1000,
            calls = Math.ceil(total / limit),
            promises = [],
            data = false;

        for (var i = 0; i < calls; i += 1) {
            promises.push(self.getDataPart(limit, i * limit));
        }

        return Promise.all(promises)
            .then(values => {
                values.forEach(function (stuff) {
                    if (!data) {
                        data = stuff;
                    } else {
                        data.rows = data.rows.concat(stuff.rows);
                    }
                });
                return data;
            })
            .then((response) => {
                self.data = response;
                self.pageq();
            });
    }

    getDataPart(limit, offset) {
        var path = this._apiEndpoint;

        return api
            .read(path + '?limit=' + limit + '&offset=' + offset + '&format=table');
    }

    pageq(options) {
        var self = this,
            page = this.pageNumber,
            cloneData = this.data.rows.slice(),
            pages,
            response,
            context;

        if (options) {
            if (options.page || options.page === 0) {
                page = options.page;
            }
        }

        if(self.filter && self.filter.length > 2) {
            cloneData = cloneData.filter(function (item) {
                var found = false;
                item.columns.forEach(function (col) {
                    if (col.value && col.value.date) {
                        var test = col.value.date.toString();
                        if (test && test.toLowerCase().indexOf(self.filter.toLowerCase()) > -1) {
                            found = true;
                        }
                    } else if (col.value && col.value.toLowerCase().indexOf(self.filter.toLowerCase()) > -1) {
                        found = true;
                    }
                });
                return found;
            });
        }

        this.data.paging.total = cloneData.length;
        this.data.paging.perPage = self.perPage;
        this.data.paging.pages = Math.ceil((cloneData.length / this.data.paging.perPage));
        if ((page + 1) > this.data.paging.pages) {
            page = 0;
        }
        pages = cloneData.splice(page * this.perPage, this.perPage);
        page += 1;
        this.data.paging.start = page - 3;
        this.data.paging.finish = page + 3;
        this.data.paging.page = page;

        response = {
            paging: this.data.paging,
            columns: this.data.columns,
            rows: pages
        };
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

        return this.drawRows(context)
            .then(() => {
                self.api();
            })
            .then(() => {
                self.drawPaging(context);
            })
            .then(() => {
                var push = {};
                push.page = page;
                if (self.filter && self.filter.length > 2) {
                    push.q = self.filter;
                }
                replaceState(push);
            });
    }

    sortData(field, dir) {
        var direction = dir || 'desc';

        this.data.rows.sort(function (a, b) {
            var fieldA,
                fieldB;

            if (a.columns[field].value && a.columns[field].value.date) {
                fieldA = a.columns[field].value.date;
            } else if (a.columns[field].value) {
                fieldA = a.columns[field].value.toLocaleLowerCase();
            }

            if (b.columns[field].value && b.columns[field].value.date) {
                fieldB = b.columns[field].value.date;
            } else if (b.columns[field].value) {
                fieldB = b.columns[field].value.toLocaleLowerCase();
            }
            if (direction === 'desc') {
                if (!fieldA) {
                    return -1;
                }
                if (!fieldB) {
                    return 1;
                }
                if (fieldA < fieldB) {
                    return -1;
                }
                if (fieldA > fieldB) {
                    return 1;
                }
                return 0;
            } else {
                if (!fieldB) {
                    return -1;
                }
                if (!fieldA) {
                    return 1;
                }
                if (fieldB < fieldA) {
                    return -1;
                }
                if (fieldB > fieldA) {
                    return 1;
                }
                return 0;
            }
        });
        this.pageq();
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

    sorting() {
        let self = this;
        lackey.bind('th[data-sort]', 'click', (event, hook) => {
            event.stopPropagation();
            event.preventDefault();
            if (self.ready) {
                var direction = hook.getAttribute('data-direction');

                if (!direction || direction === 'asc') {
                    direction = 'desc';
                } else {
                    direction = 'asc';
                }
                Array.prototype.forEach.call(document.querySelectorAll('th[data-sort]'), function (th) {
                    th.setAttribute('data-direction', '');
                });
                hook.setAttribute('data-direction', direction);
                self.sortData(hook.getAttribute('data-sort'), direction);
            }
            return false;
        });
    }

    setProps(options) {
        var self = this;
        Object.keys(options).forEach(function (property) {
            if (property === 'page') {
                self.pageNumber = parseInt(options[property]) - 1;
            } else if (property === 'q') {
                self.filter = options[property];
            }
        });
    }

    static init() {
        return lackey.getWithAttribute('data-lky-table').map((element) => {
            return new Table(element);
        });
    }
}

module.exports = Table;
