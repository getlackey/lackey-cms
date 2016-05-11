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

const
    should = require('should'),
    ACL = require('acl'),
    MemoryBackend = ACL.memoryBackend,
    policy = require('../../../server/policies/auth');

describe('modules/users/server/controllers/policies/auth', () => {
    /*
    it('Is allowed - no user', (callback) => {
        let res = {
            status: (status) => {
                res.status = status;
                return res;
            },
            error: (error) => {
                res.status.should.be.eql(403);
                error.should.be.eql({
                    message: 'User is not authorized'
                });
                callback();
            }
        };
        policy.isAllowed({
            route: {
                path: '/abc'
            },
            method: 'get'
        }, res, () => {
            /* istanbul ignore next *
            callback(new Error('Not here'));
        });
    });

    it('Is allowed - user with no proper rights', (callback) => {
        let res = {
            status: (status) => {
                res.status = status;
                return res;
            },
            error: (error) => {
                res.status.should.be.eql(403);
                error.should.be.eql({
                    message: 'User is not authorized'
                });
                callback();
            }
        };
        policy.isAllowed({
            user: {
                getRoles: () => {
                    return ['rookie']
                }
            },
            route: {
                path: '/abc'
            },
            method: 'get'
        }, res, () => {
            /* istanbul ignore next *
            callback(new Error('Not here'));
        });
    });

    it('Is allowed - user with rights', (callback) => {
        let res = {},
            acl = new ACL(new MemoryBackend());

        return acl.allow([{
            roles: ['rookie'],
            allows: [{
                resources: '/abc',
                permissions: ['get']
            }]
        }]).then(() => {

            policy.generateIsAllowed(acl)({
                user: {
                    getRoles: () => {
                        return ['rookie']
                    }
                },
                route: {
                    path: '/abc'
                },
                method: 'GET'
            }, res, () => {
                callback();
            });
        });
    });*/

    it('Anonymous - without user', (callback) => {
        policy.anonymous('/dashboard')({}, {}, callback);
    });

    it('Anonymous - without user', (callback) => {
        let res = {
                redirect: (dest) => {
                    dest.should.be.eql('/dashboard');
                    callback();
                }
            },
            req = {
                user: 1
            };
        policy.anonymous('/dashboard')(req, res, () => {
            /* istanbul ignore next */
            callback(new Error('not here'));
        });
    });
});
