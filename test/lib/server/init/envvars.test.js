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
    middleware = require('../../../../lib/server/init/envvars');

describe('lib/server/init/envvars', () => {
    it('Works', (callback) => {

        let req = {
                query: {
                    very: 'much'
                },
                params: {
                    abc: 'def'
                },
                originalUrl: 'http://hello:world@google.com/abc/def/ghy?q=happy+tree+friends&in=Britain#second'
            },
            res = {},
            server = {
                use: (fn) => fn(req, res, (error) => {
                    should.exist(res.locals);
                    JSON.parse(JSON.stringify(res.locals)).should.eql({
                        "url": {
                            "protocol": "http:",
                            "slashes": true,
                            "auth": "hello:world",
                            "host": "google.com",
                            "port": null,
                            "hostname": "google.com",
                            "hash": "#second",
                            "search": "?q=happy+tree+friends&in=Britain",
                            "query": "q=happy+tree+friends&in=Britain",
                            "pathname": [
                                "abc",
                                "def",
                                "ghy"
                            ],
                            "path": "/abc/def/ghy?q=happy+tree+friends&in=Britain",
                            "href": "http://hello:world@google.com/abc/def/ghy?q=happy+tree+friends&in=Britain#second"
                        },
                        "req": {
                            "query": {
                                "very": "much"
                            },
                            "params": {
                                "abc": "def"
                            }
                        },
                        "env": "+stage",
                        "name": "+name",
                        "baseUrl": "+baseUrl"
                    });
                    res.locals.url.toString().should.be.eql(req.originalUrl);
                    res.locals.url.pathname.toString().should.be.eql('/abc/def/ghy')
                    callback(error);
                })
            },
            config = {
                get: (name) => {
                    return '+' + name;
                }
            };

        middleware(server, config);


    });
});
