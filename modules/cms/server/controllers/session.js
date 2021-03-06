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
    .waitForAs('lackey-cms/modules/cms/server/controllers/session',
        SUtils.cmsMod('core').model('session'),
        SUtils.cmsMod('core').controller('crud')
    )
    .then((Model, Crud) => {
        class Controller extends Crud {

            static get model() {
                return this._overriden('model', Model);
            }

            static get field() {
                return this._overriden('field', 'sessionModel');
            }

            static list(req, res) {
                let restParams = req.getRESTQuery(true);
                restParams.options.sort = {
                    sid: 1
                };
                this.__list(restParams)
                    .then((data) => {
                        res.api(data);
                    }, (error) => {
                        res.error(req, error);
                    });
            }

            static removeAll(req, res) {
                this.model.removeAll(req.session.passport.user, req.session.id)
                    .then((result) => {
                        res.api(result);
                    }, (error) => {
                        res.error(req, error);
                    });
            }

            static table(req, res) {
                let restParams = req.getRESTQuery(true),
                    self = this;

                this.model.table(restParams.query, this.tableConfig, {
                    format: 'table',
                    sort: {
                        sid: 1
                    }
                }).then((data) => {
                    try {
                        self.mapActions(this.actions, data.columns, data.rows);
                    } catch (e) {
                        res.error(e);
                    }
                    res.js('js/cms/cms/table.js');
                    res.print('cms/cms/tableview', {
                        table: data
                    });
                }, (error) => {
                    res.error(req, error);
                });
            }

        }

        return Promise.resolve(Controller);
    });
