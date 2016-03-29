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
    BbPromise = require('bluebird');

module.exports = (data) => {

    SCli.debug('lackey/modules/users/server/models/role/generator', '1', data);

    return require('./index')
        .then((Role) => {

            let role, promise;

            if (typeof data === 'string') {
                SCli.debug('lackey/modules/users/server/models/role/generator', 'Gets Role ' + data + ' by name');
                return BbPromise.resolve(Role.getByName(data));
            }

            SCli.debug('lackey/modules/users/server/models/role/generator', 'Ensure that Role ' + data.name + ' exists');
            role = Role.getByName(data.name);

            if (!role) {
                SCli.log('lackey/modules/users/server/models/role/generator', 'Role ' + data.name + ' not found, creating');
                promise = Role.create(data);
            } else if (Generator.override('Role') && role.diff(data)) {
                SCli.log('lackey/modules/users/server/models/role/generator', 'Role ' + data.name + ' found, updating');
                promise = role.save();
            } else {
                SCli.debug('lackey/modules/users/server/models/role/generator', 'Role ' + data.name + ' found, not changed');
                promise = BbPromise.resolve(role);
            }

            SCli.debug('lackey/modules/users/server/models/role/generator', '2');

            return promise.then((endRole) => {
                SCli.debug('lackey/modules/users/server/models/role/generator', '3');
                SCli.debug('lackey/modules/users/server/models/role/generator', 'Ensured that Role ' + data.name + ' exists');
                return endRole;
            });

        });
};

Generator.registerMapper('Role', module.exports);
