/* jslint node:true, esnext:true, mocha:true */
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

const middleware = require('../../../../lib/server/init/format');

require('should');

describe('lib/server/init/format', () => {
    it('Setup', () => {

        let server = {
            _middlewares: [],
            decorateMiddleware: (args, label) => {
                server._middlewares.push(args[0]);
            }
        };

        middleware(server, {
            get: (field) => field
        });

        server._middlewares.should.be.eql([
            middleware.cors,
            middleware.format,
            middleware.rewrite
        ]);
    });

    it('Cors', (callback) => {

        let res = {
            _headers: {},
            header: (name, value) => res._headers[name] = value
        };

        middleware.cors({}, res, () => {
            res._headers.should.be.eql({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            callback();
        });

    });

    it('Format HTML', (callback) => {

        let req = {
                headers: {},
                path: '/hakuna/matata'
            },
            res = {
                _headers: {},
                header: (name, value) => res._headers[name] = value,
                send: function (output) {
                    throw output;
                },
                render: function (template, data) {
                    template.should.be.eql('adsaf');
                    data.should.be.eql({
                        hello: 1,
                        template: 'adsaf',
                        data: {},
                        user: undefined,
                        route: '/hakuna/matata',
                        admin: undefined
                    });
                    res.__doc.should.be.eql({
                        stylesheets: ['my/css', 'my/css2'],
                        javascripts: ['my/js', 'my2/js'],
                        data: {},
                        fragment: false,
                        locale: undefined,
                        post: {},
                        user: undefined,
                        defaultLocale: undefined,
                        admin: undefined,
                        edit: false,
                        route: '/hakuna/matata',
                        query: {},
                        env: 'development',
                        host: 'host',
                        session: {
                            ip: 'n/a'
                        }
                    });
                    callback();
                },
            };

        middleware.format(req, res, () => {
            res.css('my/css');
            res.css(['my/css2']);
            res.js('my/js');
            res.js(['my2/js']);
            res.send({
                hello: 1,
                template: 'adsaf'
            });
        });

    });

    it('Format JSON', (callback) => {

        let req = {
                headers: {},
                path: '/hakuna/matata.json',
                session: {
                    ipAddress: '1.1.1.1'
                }
            },
            res = {
                _headers: {},
                header: (name, value) => res._headers[name] = value,
                send: function (data) {
                    JSON.parse(data).should.be.eql({
                        "hello": 1,
                        "template": "adsaf",
                        "data": {},
                        "route": "/hakuna/matata.json"
                    });
                    res.__doc.should.be.eql({
                        stylesheets: ['my/css', 'my/css2'],
                        javascripts: ['my/js', 'my2/js'],
                        data: {},
                        fragment: false,
                        user: undefined,
                        admin: undefined,
                        locale: undefined,
                        post: {},
                        defaultLocale: undefined,
                        edit: false,
                        route: '/hakuna/matata.json',
                        query: {},
                        env: 'development',
                        host: 'host',
                        session: {
                            ip: '1.1.1.1'
                        }
                    });
                    callback();
                },
                render: function () {
                    callback(new Error('Shouldn\'t be here'));

                },
            };

        middleware.format(req, res, () => {
            res.css('my/css');
            res.css(['my/css2']);
            res.js('my/js');
            res.js(['my2/js']);
            res.send({
                hello: 1,
                template: 'adsaf'
            });
        });

    });

    it('Format error', (callback) => {

        let req = {
                headers: {},
                path: '/hakuna/matata.json'
            },
            res = {
                _headers: {},
                header: (name, value) => res._headers[name] = value,
                send: function (data) {

                    JSON.parse(data).should.be.eql({
                        "template": "cms/core/error",
                        "route": "/hakuna/matata.json",
                        "data": {
                            "message": "AAAA!"
                        }
                    });
                    res.__doc.should.be.eql({
                        stylesheets: ['my/css', 'my/css2'],
                        javascripts: ['my/js', 'my2/js'],
                        data: {},
                        fragment: false,
                        user: undefined,
                        admin: undefined,
                        locale: undefined,
                        post: {},
                        defaultLocale: undefined,
                        edit: false,
                        route: '/hakuna/matata.json',
                        query: {},
                        env: 'development',
                        host: 'host',
                        session: {
                            ip: 'n/a'
                        }
                    });
                    callback();
                },
                status: (nr) => {
                    res._status = nr;
                    return res;
                },
                render: function () {
                    callback(new Error('Shouldn\'t be here'));

                },
            };

        middleware.format(req, res, () => {
            res.css('my/css');
            res.css(['my/css2']);
            res.js('my/js');
            res.js(['my2/js']);
            res.error(req, {
                message: 'AAAA!'
            });
        });

    });

    it('Format Print', (callback) => {

        let req = {
                headers: {},
                path: '/hakuna/matata.json'
            },
            res = {
                _headers: {},
                header: (name, value) => res._headers[name] = value,
                send: function (data) {
                    JSON.parse(data).should.be.eql({
                        "data": {},
                        "template": {
                            "message": "AAAA!"
                        },
                        "stylesheets": ["my/css", "my/css2"],
                        "javascripts": ["my/js", "my2/js"],
                        "edit": false,
                        fragment: false,
                        "route": "/hakuna/matata.json",
                        post: {},
                        query: {},
                        env: 'development',
                        host: 'host',
                        session: {
                            ip: 'n/a'
                        }
                    });
                    res.__doc.should.be.eql({
                        stylesheets: ['my/css', 'my/css2'],
                        javascripts: ['my/js', 'my2/js'],
                        data: {},
                        user: undefined,
                        admin: undefined,
                        fragment: false,
                        locale: undefined,
                        post: {},
                        defaultLocale: undefined,
                        edit: false,
                        route: '/hakuna/matata.json',
                        query: {},
                        env: 'development',
                        host: 'host',
                        session: {
                            ip: 'n/a'
                        }
                    });
                    callback();
                },
                render: function () {
                    callback(new Error('Shouldn\'t be here'));

                },
            };

        middleware.format(req, res, () => {
            res.css('my/css');
            res.css(['my/css2']);
            res.js('my/js');
            res.js(['my2/js']);
            res.print({
                message: 'AAAA!'
            });
        });

    });
});
