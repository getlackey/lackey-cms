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

const
    SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    Model = objection.Model,
    SCli = require(LACKEY_PATH).cli,
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/role',
    KNEX = require('../knex');

SCli.debug(__MODULE_NAME, 'REQUIRED');

module.exports = SUtils
    .waitForAs(
        __MODULE_NAME,
        SUtils.cmsMod('core').model('taggable'),
        KNEX
    )
    .then((Taggable) => {

        SCli.debug(__MODULE_NAME, 'READY');

        require('./generator');

        let lighweights = {};

        class RoleToTaxonomy extends Model {
            static get tableName() {
                return 'roleToTaxonomy';
            }
        }

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

        class Role extends Taggable {

            static get api() {
                return '/cms/role';
            }


            static get model() {
                return RoleModel;
            }

            static get taxonomyRelationModel() {
                return RoleToTaxonomy;
            }

            static get taxonomyRelationField() {
                return 'roleId';
            }

            static reload() {
                let policy;
                return SUtils
                    .cmsMod('users')
                    .policy('auth')
                    .then((p) => {
                        policy = p;
                        return Role.find();
                    })
                    .then((list) => { // eslint-disable-line no-use-before-define
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

            toJSON() {
                return {
                    name: this.name,
                    label: this.label,
                    acl: this.acl,
                    taxonomies: this.taxonomies
                };
            }

            static getByName(name) {
                return lighweights[name];
            }

            static getLabelByName(name) {
                if (lighweights[name]) {
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

            _populate() {
                return super
                    ._populate()
                    .then((self) => {
                        if (typeof self._doc.acl === 'string') {
                            self._doc.acl = JSON.parse(self._doc.acl);
                        }
                        return self;
                    });
            }

        }

        return Role
            .reload()
            .then(() => Role);
    });
