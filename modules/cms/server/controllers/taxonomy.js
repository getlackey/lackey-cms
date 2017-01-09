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

module.exports = SUtils
    .waitForAs('taxonomyCtrl',
        SUtils.cmsMod('core').model('taxonomy'),
        SUtils.cmsMod('core').controller('crud')
    )
    .then((Model, Crud) => {
        class Controller extends Crud {

            static get model() {
                return this._overriden('model', Model);
            }

            static get field() {
                return this._overriden('field', 'taxonomy');
            }

            static get tableConfig() {
                return this._overriden('tableConfig', {
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

                });
            }

             static get actions() {
                return this._overriden('actions', [{
                    label: 'View',
                    icon: 'img/cms/cms/svg/preview.svg',
                    href: 'cms/taxonomy/{id}'
                }]);
            }

            static details(req, res) {
                Model
                    .findById(req.params.taxonomy_id)
                    .then(taxonomy => {
                        if (taxonomy) {
                            res.css('css/cms/cms/media.css');
                            res.js('js/cms/cms/context.js');
                            res.print('cms/cms/taxonomy', {
                                taxonomy: taxonomy.toJSON(false)
                            });
                        } else {
                            res.redirect('cms/taxonomy');
                        }
                    });
            }

        }

        return Promise.resolve(Controller);
    });
