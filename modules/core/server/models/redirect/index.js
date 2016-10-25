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

const SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    SCli = require(LACKEY_PATH).cli,
    Model = objection.Model,
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/redirect';

SCli.debug(__MODULE_NAME, 'REQUIRED');

module.exports = SUtils
    .waitForAs(__MODULE_NAME,
        SUtils.cmsMod('core').model('flyweight'),
        require('../knex')
    )
    .then((FlyWeight) => {

        SCli.debug(__MODULE_NAME, 'READY');

        class RedirectModel extends Model {
            static get tableName() {
                return 'redirect';
            }
        }

        /**
         * @class
         */
        class Redirect extends FlyWeight {

            static get api() {
                return '/cms/redirect';
            }

            static get createLink() {
                return 'cms/redirect/create';
            }

            static get model() {
                return RedirectModel;
            }

            get route() {
                return this._doc.route;
            }

            set route(value) {
                this._doc.route = value;
            }

            get target() {
                return this._doc.target;
            }

            set target(value) {
                this._doc.target = value;
            }

            get type() {
                return this._doc.type;
            }

            get status() {
                return this._doc.status;
            }

            set status(value) {
                this._doc.type = value;
            }

            static get PERM() {
                    return 301;
                } // make 301 redirect
            static get TEMP() {
                    return 302;
                } // make 302 redirect
            static get ALT() {
                    return 200;
                } // load target under current route

            static getByRoute(route) {
                return SCli.sql(Redirect
                        .model
                        .query()
                        .where('route', route)
                    )
                    .then((result) => {
                        if (result && result.length) {
                            return new Redirect(result[0]);
                        }
                        return null;
                    });
            }

            toJSON() {
                return {
                    id: this.id,
                    route: this._doc.route,
                    target: this._doc.target,
                    type: this._doc.type
                };
            }

        }

        Redirect.generator = require('./generator');

        return Redirect;
    });
