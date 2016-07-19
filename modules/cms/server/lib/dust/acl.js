/* jslint node:true, esnext:true */
/* eslint no-param-reassign:0 */
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

const SUtils = require(LACKEY_PATH).utils;

module.exports = (dust) => {

    dust.helpers.acl = function (chunk, context, bodies, params) {
        let user = context.get('admin'),
            perm = params.perm,
            method = params.method;

        return SUtils.cmsMod('core').model('user')
            .then((User) => {
                return User.findById(user.id);
            }).then((userModel) => {
                return userModel.isAllowed(perm, method);
            })
            .then((isAllowed) => {
                if (!isAllowed) {
                    chunk.render(bodies.else, context);
                }
                return chunk;
            }, (error) => {
                console.error(error);
            });
    };
};
