/* jslint esnext:true, node:true, mocha:true */
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
    acl = require('../../../../server/lib/dust/acl'),
    dbsInit = require('../../../../../../test/mockup/dbs'),
    SUtils = require(LACKEY_PATH).utils;

require('should');

let userModel,
    admin,
    guest,
    dust = {
        helpers: {}
    },
    chunk = {
        value: true,
        render: () => {
            return false;
        }
    },
    bodies = {},
    params = {
        perm: 'adminMenu',
        method: 'content'
    };

describe('models/cms/server/lib/dust/acl', () => {

    before((done) => {
        dbsInit(() => {
            SUtils
                .cmsMod('core')
                .model('user')
                .then((User) => {
                    userModel = User;
                    let data = {
                        name: 'testadmin',
                        title: 'mr',
                        password: 'password67',
                        email: 'jason@dev.co.uk',
                        roles: ['developer']
                    };
                    return userModel.generator(JSON.parse(JSON.stringify((data))));
                })
                .then((user) => {
                    admin = user;
                    let data = {
                        name: 'testguest',
                        title: 'mr',
                        password: 'password67',
                        email: 'jason@guest.co.uk',
                        roles: ['guest']
                    };
                    return userModel.generator(JSON.parse(JSON.stringify((data))));
                })
                .then((user) => {
                    guest = user;
                    done();
                })
                .catch((error) => {
                    /* istanbul ignore next */
                    console.error(error);
                });
        });
    });

    it('Admin has permissions', (done) => {
        let context = {
                get: () => {
                    return {
                        id: admin._doc.id
                    };
                }
            };
        acl(dust);
        dust.helpers.acl(chunk, context, bodies, params)
            .then((result) => {
                result.should.be.eql(chunk);
                done();
            });
    });

    it('Guest doest not have permissions', (done) => {
        let context = {
                get: () => {
                    return {
                        id: guest._doc.id
                    };
                }
            };
        acl(dust);
        dust.helpers.acl(chunk, context, bodies, params)
            .then((result) => {
                result.should.be.eql(false);
                done();
            });
    });
});
