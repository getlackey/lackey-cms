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
    middleware = require('../../../../lib/server/init/crud');

describe('lib/server/init/crud', () => {

    it('Works', () => {

        let server = {
            _routes: {},
            route: (path) => {
                let route = server._routes[path] = {
                    _get: [],
                    _put: [],
                    _post: [],
                    _delete: [],
                    all: (input) => {
                        route._get.push(input);
                        route._put.push(input);
                        route._post.push(input);
                        route._delete.push(input);
                        return route;
                    },
                    get: (input) => route._get.push(input),
                    post: (input) => route._post.push(input),
                    put: (input) => route._put.push(input),
                    delete: (input) => route._delete.push(input)
                };
                return route;
            },
            _params: {},
            param: (id, middleware) => {
                server._params[id] = middleware;
            }
        };

        middleware(server);

        server.crud('/my/path', 'elem', 'middleware', {
            create: 1,
            read: 2,
            update: 3,
            delete: 4,
            list: 5,
            byID: 6
        });

        JSON.parse(JSON.stringify(server)).should.be.eql({
            "_routes": {
                "/my/path": {
                    "_get": ["middleware", 5],
                    "_put": ["middleware"],
                    "_post": ["middleware", 1],
                    "_delete": ["middleware"]
                },
                "/my/path/:elem_id": {
                    "_get": ["middleware", 2],
                    "_put": ["middleware", 3],
                    "_post": ["middleware"],
                    "_delete": ["middleware", 4]
                }
            },
            "_params": {
                "elem_id": 6
            }
        });

    });

    it('Works - auto params', (callback) => {

        let req = {},
            server = {
            _routes: {},
            route: (path) => {
                let route = server._routes[path] = {
                    _get: [],
                    _put: [],
                    _post: [],
                    _delete: [],
                    all: (input) => {
                        route._get.push(input);
                        route._put.push(input);
                        route._post.push(input);
                        route._delete.push(input);
                        return route;
                    },
                    get: (input) => route._get.push(input),
                    post: (input) => route._post.push(input),
                    put: (input) => route._put.push(input),
                    delete: (input) => route._delete.push(input)
                };
                return route;
            },
            _params: {},
            param: (id, middleware) => {
                server._params[id] = middleware;
            }
        };

        middleware(server);

        server.crud('/my/path', 'elem', 'middleware', {
            create: 1,
            read: 2,
            update: 3,
            delete: 4,
            list: 5
        });

        JSON.parse(JSON.stringify(server)).should.be.eql({
            "_routes": {
                "/my/path": {
                    "_get": ["middleware", 5],
                    "_put": ["middleware"],
                    "_post": ["middleware", 1],
                    "_delete": ["middleware"]
                },
                "/my/path/:elem_id": {
                    "_get": ["middleware", 2],
                    "_put": ["middleware", 3],
                    "_post": ["middleware"],
                    "_delete": ["middleware", 4]
                }
            },
            "_params": {
            }
        });

        server._params.elem_id(req, {}, () => {
            req.elem_id.should.be.eql(123456);
            callback();
        }, 123456);

    });


});
