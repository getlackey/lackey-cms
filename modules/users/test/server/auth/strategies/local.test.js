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

var should = require('should'),
    dbsInit = require('../../../../../../test/mockup/dbs'),
    strategy,
    USERNAME_UNKNOWN = 'USERNAME_UNKNOWN',
    USERNAME = 'USERNAME',
    USERNAME_ERR = 'USERNAME_ERR',
    WRONG_PASSWORD = 'WRONG_PASSWORD',
    PASSWORD = 'PASSWORD',
    UserMockupObject = {
        USERNAME: 'username',
        EMAIL: 'email',
        getByProvider: function (providers, id) {
            return new Promise((resolve, reject) => {
                try {
                    should(providers).eql([UserMockupObject.USERNAME, UserMockupObject.EMAIL]);
                    if (id === USERNAME_UNKNOWN) return resolve();
                    if (id === USERNAME_ERR) return reject(new Error('err'));
                    resolve({
                        authenticate: function (password) {
                            return (password === PASSWORD);
                        }
                    });
                } catch (ex) {
                    /* istanbul ignore next */
                    reject(ex);
                }
            });
        }
    },
    UserMockup = Promise.resolve(UserMockupObject);

describe('modules/users/server/auth/strategies/local', function () {

    before((done) => {
        dbsInit(() => {
            strategy = require('../../../../server/auth/strategies/local');
            done();
        });
    });

    it('Handle unknown user', function (next) {

        strategy.handler(UserMockup)(USERNAME_UNKNOWN, WRONG_PASSWORD, function (err, user, msg) {
            try {
                should.not.exist(err);
                should(user).be.False;
                should.exist(msg.message);
                next();
            } catch (e) {
                next(e);
            }
        });

    });

    it('Handle wrong password', function (next) {

        strategy.handler(UserMockup)(USERNAME, WRONG_PASSWORD, function (err, user, msg) {
            try {
                should.not.exist(err);
                should(user).be.False;
                should.exist(msg.message);
                next();
            } catch (er) {
                /* istanbul ignore next */
                next(er);
            }
        });

    });

    it('Handle valid user', function (next) {

        strategy.handler(UserMockup)(USERNAME, PASSWORD, function (err, user) {
            try {
                should.not.exist(err);
                should(user).be.Object;
                next();
            } catch (er) {
                /* istanbul ignore next */
                next(er);
            }
        });

    });

    it('Handle error', function (next) {

        strategy.handler(UserMockup)(USERNAME_ERR, PASSWORD, function (err) {
            try {
                should.exist(err);
                next();
            } catch (er) {
                /* istanbul ignore next */
                next(er);
            }

        });

    });

});
