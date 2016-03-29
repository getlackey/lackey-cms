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
const
    policy = require('../../policies/auth'),
    SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    Model = objection.Model;

module.exports = SUtils.deps(
        SUtils.cmsMod('core').model('objection'),
        require('./knex'))
    .promised((ObjecitonWrapper) => {

        require('./generator');

        let lighweights = {};

        class RoleModel extends Model {
            static get tableName() {
                return 'roles';
            }
            static get jsonSchema() {
                return {
                    type: 'object',
                    required: [],
                    properites: {
                        id: {
                            type: 'integer'
                        },
                        name: {
                            type: 'string'
                        },
                        label: {
                            type: 'string'
                        },
                        updated_at: {
                            type: 'date'
                        },
                        created_at: {
                            type: 'date'
                        },
                        acl: {
                            type: 'json'
                        }
                    }
                };
            }

            $formatDatabaseJson(obj) {
                delete obj.stages;
                return super.$formatDatabaseJson(obj);
            }
        }

        function reload() {
            return Role.find().then((list) => { // eslint-disable-line no-use-before-define
                lighweights = {};
                list.forEach((role) => {
                    lighweights[role.name] = role;
                    if (role.acl) {
                        Object.keys(role.acl).forEach((resource) => {
                            policy.setRoleAcl(role.name, resource, role.acl[resource]);
                        });
                    }
                });
                return true;
            });
        }

        class Role extends ObjecitonWrapper {

            static get model() {
                return RoleModel;
            }

            toJSON() {
                return {
                    name: this.name,
                    label: this.label
                };
            }

            _postSave() {
                let self = this;
                return reload().then(() => self);
            }

            static getByName(name) {
                return lighweights[name];
            }

            static getLabelByName(name) {
                if(lighweights[name]) {
                    return lighweights[name].label;
                }
                return null;
            }

            static all() {
                return Object.keys(lighweights).map((key) => lighweights[key]);
            }

            static roleNames() {
                return Object.keys(lighweights);
            }

            get label() {
                return this._doc.label;
            }

            set label(value) {
                this._doc.label = value;
            }

            get acl() {
                return this._doc.acl;
            }

            set acl(value) {
                this._doc.acl = value;
            }

            static removeAll() {
                lighweights = {};
                return super.removeAll();
            }

        }

        return reload().then(() => Role);
    });
