/* jslint esnext:true, node:true */
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

const SUtils = require(LACKEY_PATH).utils;


module.exports = SUtils
    .waitForAs('usersController',
        SUtils.cmsMod('core').model('user'),
        SUtils.cmsMod('core').controller('crud')
    )
    .then((Model, Crud) => {
        class Controller extends Crud {

            static get model() {
                return this._overriden('model', Model);
            }

            static get field() {
                return this._overriden('field', 'user');
            }

            static get title() {
                return this._overriden('title', 'Users');
            }

            static get tableConfig() {
                return this._overriden('tableConfig', {
                    name: {
                        label: 'Name',
                        like: true
                    },
                    roles: {
                        label: 'Roles',
                        parse: 'return arguments[0] ? arguments[0].map(function(r) { return r.label || r.name;}) : \'\''
                    },
                    taxonomies: {
                        label: 'Classification',
                        parse: 'return arguments[0] ? arguments[0].map(function(r) { return r.label || r.name;}) : \'\''
                    }
                });
            }

            static get tableActions() {
                return this._overriden('tableActions', undefined);
            }

            static preview(req, res) {
                res.css('css/cms/cms/table.css');
                res.print('cms/users/preview', req.user);
            }

        }

        return Promise.resolve(Controller);
    });
