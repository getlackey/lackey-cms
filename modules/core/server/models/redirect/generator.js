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

const SCli = require(LACKEY_PATH).cli,
    Generator = require(LACKEY_PATH).generator;

let Redirect;

module.exports = (data) => {

    let path;

    return require('./index')
        .then((redirect) => {
            Redirect = redirect;
            if (typeof data === 'number') {
                return Redirect.findById(data);
            }
            SCli.debug('lackey/modules/cms/server/models/redirect/generator', 'Ensure that redirect ' + data.route + ' to ' + data.target + ' exists');
            return Redirect.getByRoute(data.route).then((redirectObj) => {
                let wrapped = (typeof data === 'string') ? {
                    path: data
                } : data;
                if (!redirectObj) {
                    SCli.log('lackey/modules/cms/server/models/redirect/generator', 'Create redirect ' + path);
                    return Redirect.create(wrapped);
                }
                if (Generator.override('Redirect') && redirectObj.diff(wrapped)) {
                    return redirectObj.save();
                }
                return redirectObj;
            });
        }).then((redirect) => {
            SCli.debug('lackey/modules/cms/server/models/redirect/generator', 'Ensured that redirect ' + JSON.stringify(data) + ' exists');
            return redirect;
        });
};

Generator.registerMapper('Redirect', module.exports);
