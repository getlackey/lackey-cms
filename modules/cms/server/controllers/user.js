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

const
    SUtils = require(LACKEY_PATH).utils,
    CRUD = SUtils.cmsMod('core').controller('crud.injection', true);

/**
 * @class
 * @name UserController
 * Users CMS Controller
 *
 */
class UserController extends CRUD {

    /**
     * @override
     * @see lackey-cms/modules/core/server/controllers/CrudInjectionController#field
     */
    static get field() {
        return this._overriden('field', 'profile');
    }

    /**
     * @override
     * @see lackey-cms/modules/core/server/controllers/CrudInjectionController#title
     */
    static get title() {
        return this._overriden('title', 'Users');
    }

    /**
     * @override
     * @see lackey-cms/modules/core/server/controllers/CrudInjectionController#actions
     */
    static get actions() {
        return this._overriden('actions', [{
            label: 'Edit',
            icon: 'img/cms/cms/svg/preview.svg',
            href: '/cms/user/{id}'
        }, {
            label: 'Remove',
            icon: 'img/cms/cms/svg/close.svg',
            api: 'DELETE:/cms/user/{id}'
        }]);
    }

    /**
     * @override
     * @see lackey-cms/modules/core/server/controllers/CrudInjectionController#tableOptions
     */
    static get tableOptions() {
        return this._overriden('tableOptions', {
            sorts: [{
                field: 'name',
                label: 'Names'
                    }]
        });
    }

    /**
     * @override
     * @see lackey-cms/modules/core/server/controllers/CrudInjectionController#delete
     */
    static delete(model, req, res) {

        let del = super.delete;

        if (!req.admin) {
            return res.error403();
        }

        if (req.admin.id === req.profile.id) {
            return res.error('Can\'t delete yourself');
        }

        return Promise
            .all(req.profile.roles.map(role => {
                return req.admin.isAllowed('manageUser', role.name);
            }))
            .then(isAllowed => {
                if (isAllowed.filter(allowed => !allowed).length === 0) {
                    return del.apply(this, [model, req, res]);
                } else {
                    return res.error403();
                }
            });
    }

    /**
     * @override
     * @see lackey-cms/modules/core/server/controllers/CrudInjectionController#tableConfig
     */
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
            },
            lastActive: {
                label: 'Last Active',
                date: true
            }
        });
    }

    /**
     * @override
     * @see lackey-cms/modules/core/server/controllers/CrudInjectionController#tableActions
     */
    static get tableActions() {
        return this._overriden('tableActions', undefined);
    }

    static details(TaxonomyType, req, res) {
        TaxonomyType
            .findBy('restrictive', true)
            .then(restrictive => {
                res.css('css/cms/cms/profile.css');
                res.js('js/cms/cms/profile.js');
                res.print('cms/cms/profile', {
                    profile: req.profile.toJSON(false),
                    restrictive: restrictive
                });
            });
    }

}

module.exports = UserController;
