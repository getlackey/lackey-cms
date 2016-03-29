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
if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const
    dbsInit = require('../../../../../test/mockup/dbs'),
    Generator = require(LACKEY_PATH).generator;

require('should');

let controller;

describe('modules/users/server/controllers/login', () => {

    before((done) => {
        dbsInit(() => {
            require('../../../server/models/user');
            require('../../../server/auth/strategies/local')();
            return Generator.load(__dirname + '/../../../../../modules/users/module.yml', true).then(() => {
                return require('../../../server/controllers/login');
            }).then((ctrl) => {
                controller = ctrl;
                done();
            });

        });
    });

    it('index', (done) => {
        controller.index({}, {
            print: (data) => {
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
                error: (error) => {
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
                    username: 'test@example.com',
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
                }
            },
            next = (error) => {
                /* istanbul ignore next */
                console.error(error);
            };
        controller.login(req, res, next);
    });

});
