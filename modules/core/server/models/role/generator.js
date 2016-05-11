/* eslint no-underscore-dangle:0 */
/* jslint node:true, esnext:true */
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

const SCli = require(LACKEY_PATH).cli,
    Generator = require(LACKEY_PATH).generator,
    __MODULE_NAME = 'lackey/modules/core/server/models/role/generator';


module.exports = (data) => {

    return require('./index')
        .then((Role) => {

            let role, promise;

            if (typeof data === 'string') {
                SCli.debug(__MODULE_NAME, 'Gets Role ' + data + ' by name');
                return Promise.resolve(Role.getByName(data));
            }

            SCli.debug(__MODULE_NAME, 'Ensure that Role ' + data.name + ' exists');
            role = Role.getByName(data.name);

            if (!role) {
                SCli.debug(__MODULE_NAME, 'Role ' + data.name + ' not found, creating');
                promise = Role.create(data);
            } else if (Generator.override('Role') && role.diff(data)) {
                SCli.debug(__MODULE_NAME, 'Role ' + data.name + ' found, updating');
                promise = role.save();
            } else {
                SCli.debug(__MODULE_NAME, 'Role ' + data.name + ' found, not changed');
                promise = Promise.resolve(role);
            }

            return promise.then((endRole) => {
                SCli.debug(__MODULE_NAME, 'Ensured that Role ' + data.name + ' exists');
                return Role
                    .reload()
                    .then(() => endRole);
            });

        });
};

Generator.registerMapper('Role', module.exports);
