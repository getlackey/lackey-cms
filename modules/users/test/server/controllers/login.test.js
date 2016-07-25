/* jslint node:true, esnext:true, mocha:true */
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
    dbsInit = require('../../../../../test/mockup/dbs'),
    SUtils = require(LACKEY_PATH).utils,
    Generator = require(LACKEY_PATH).generator;

require('should');

let controller;

describe('modules/users/server/controllers/login', () => {

    before((done) => {
        dbsInit(() => {
            SUtils
                .cmsMod('core')
                .model('user')
                .then(() => {
                    require('../../../server/auth/strategies/local')();
                    return Generator
                        .load(__dirname + '/../../../../../modules/users/module.yml', true);
                })
                .then(() => {
                    return require('../../../server/controllers/login');
                })
                .then((ctrl) => {
                    controller = ctrl;
                    done();
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    });

    it('index', (done) => {
        controller.index({}, {
            print: () => {
                done();
            }
        });
    });

    it('login -> 400', (done) => {
        let req = {},
            res = {
                status: (status) => {
                    res._status = status;
                    return res;
                },
                error: () => {
                    res._status.should.be.eql(400);
                    done();
                }
            },
            next = (error) => {
                /* istanbul ignore next */
                console.error(error);
            };
        controller.login(req, res, next);
    });

    it('login -> 200', (done) => {
        let req = {
                body: {
                    username: 'test@test.com',
                    password: 'password'
                },
                login: (user, cb) => {
                    req.user = user;
                    cb();
                }
            },
            res = {
                redirect: (uri) => {
                    uri.should.be.eql('/');
                    done();
                },
                status: () => {
                    done(new Error('Should\'t be here'));
                }
            },
            next = (error) => {
                /* istanbul ignore next */
                console.error(error);
            };
        controller.login(req, res, next);
    });

    it('login -> 200', (done) => {
        let req = {
                body: {
                    username: 'TEST@teSt.com',
                    password: 'password'
                },
                login: (user, cb) => {
                    req.user = user;
                    cb();
                }
            },
            res = {
                redirect: (uri) => {
                    uri.should.be.eql('/');
                    done();
                },
                status: () => {
                    done(new Error('Should\'t be here'));
                }
            },
            next = (error) => {
                /* istanbul ignore next */
                console.error(error);
            };
        controller.login(req, res, next);
    });

});
