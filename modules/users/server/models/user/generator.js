/* eslint no-underscore-dangle:0 */
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
if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const SCli = require(LACKEY_PATH).cli,
    Generator = require(LACKEY_PATH).generator,
    roleGenerator = require('../role/generator');

let User;

module.exports = (data) => {
    return require('./index')
        .then((user) => {

            User = user;
            SCli.debug('lackey/modules/users/server/models/user/generator', 'Ensure that User ' + data.email + ' exists');
            return User.getByProvider('email', data.email);
        }).then((user) => {

            if (user) {
                SCli.debug('lackey/modules/users/server/models/user/generator', 'User ' + data.email + ' exists');
                return user;
            }
            SCli.log('lackey/modules/users/server/models/user/generator', 'Creating user ' + data.email + ' exists');

            function next() {
                return User.create(data).then((endUser) => {
                    SCli.debug('lackey/modules/users/server/models/user/generator', 'Created user ' + data.email + ' exists');
                    return endUser;
                });
            }

            if (data.roles) {
                return Promise.all(data.roles.map((role) => {
                    return roleGenerator(role).then((generatedRole) => {
                        if (!generatedRole) {
                            throw Error('Can\'t find role ', role);
                        }
                        return generatedRole.id;
                    });
                })).then((roles) => {
                    data.roles = roles;
                    return next();
                });
            }
            return next();

        });
};

Generator.registerMapper('User', module.exports);
