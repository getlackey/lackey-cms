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

const should = require('should'),
    qs = require('query-string'),
    rest = require('../../../../lib/server/init/rest').rest;

describe('lib/server/init/rest', () => {

    let tests = {
        'sort=-priority': {
            query: {},
            populate: null,
            options: {
                format: undefined,
                sort: {
                    priority: -1
                }
            }
        },
        'sort=-priority,created_at': {
            query: {},
            populate: null,
            options: {
                format: undefined,
                sort: {
                    priority: -1,
                    created_at: 1
                }
            }
        },
        'state=closed&sort=-updated_at': {
            query: {
                state: 'closed'
            },
            populate: null,
            options: {
                format: undefined,
                sort: {
                    updated_at: -1
                }
            }
        },
        'q=return&state=open&sort=-priority,created_at': {
            query: {
                state: 'open'
            },
            populate: null,
            options: {
                format: undefined,
                sort: {
                    priority: -1,
                    created_at: 1
                },
                textSearch: 'return'
            }
        },
        'fields=id,subject,customer_name,updated_at&state=open&sort=-updated_at': {
            query: {
                state: 'open'
            },
            populate: {
                id: 1,
                subject: 1,
                customer_name: 1,
                updated_at: 1
            },
            options: {
                format: undefined,
                sort: {
                    updated_at: -1
                }
            }
        },
        'fields=-id,subject,customer_name,updated_at&state=open&sort=-updated_at': {
            query: {
                state: 'open'
            },
            populate: {
                id: -1,
                subject: 1,
                customer_name: 1,
                updated_at: 1
            },
            options: {
                format: undefined,
                sort: {
                    updated_at: -1
                }
            }
        },
        'state=closed&limit=123&offset=12&sort=-updated_at': {
            query: {
                state: 'closed'
            },
            populate: null,
            options: {
                format: undefined,
                sort: {
                    updated_at: -1
                },
                limit: 123,
                offset: 12
            }
        },
    };


    Object.keys(tests).forEach((test) => {

        it(test + ' => ' + JSON.stringify(tests[test]), (next) => {

            let req = {
                    query: qs.parse(test)
                },
                res = {};

            rest(req, res, (error) => {
                should.not.exist(error);
                req.getRESTQuery().should.be.eql(tests[test]);
                next();
            });
        });

    });

    it('Map table data', (next) => {

        let req = {},
            res = {
                api: (data) => {
                    data.should.be.eql({
                        "paging": {
                            "current": "todo",
                            "next": "todo",
                            "previous": "todo"
                        },
                        "data": [[{
                            "value": 1
                        }, {
                            "value": 2
                        }]]
                    });
                    next();
                }
            };

        rest(req, res, (error) => {

            res.table({
                paging: {

                },
                rows: [{
                    columns: [{
                        value: 1
                    }, {
                        value: 2
                    }]
                }]
            });


        });
    });


});
