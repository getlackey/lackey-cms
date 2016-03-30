/* jslint esnext:true, node:true */
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

module.exports = SUtils.deps(
        SUtils.cmsMod('users').model('user'),
        SUtils.cmsMod('core').controller('crud')
    )
    .promised((Model, Crud) => {
        class Controller extends Crud {

            static get model() {
                return Model;
            }

            static get field() {
                return 'user';
            }

            static get tableConfig() {
                return null;/*{
                    name: {
                        label: 'Name',
                        like: true
                    },
                    label: {
                        label: 'Label',
                        like: true
                    },
                    type: {
                        name: 'Type',
                        parse: 'return arguments[0] ? arguments[0].label : \'\''
                    }

                };*/
            }


        }

        return Promise.resolve(Controller);
    });
