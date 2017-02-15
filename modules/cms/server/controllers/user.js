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

    static get tableRowAction() {
        return this._overriden('tableRowAction', {
            href: 'cms/user/{id}',
            template: 'cms/core/profile-modal',
            javascript: 'editProfile'
        });
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

    static get filterOptions() {
        return this._overriden('filterOptions', {
            template: 'user-filter'
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
                label: 'Access',
                parse: 'return arguments[0] ? arguments[0].map(function(r) { return r.label || r.name;}) : \'\''
            },
            taxonomies: {
                label: 'Classification',
                parse: 'return arguments[0] ? arguments[0].map(function(r) { return r.label || r.name;}) : \'\'',
                default: ['n/a']
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
                if (req.profile._doc.deleted) {
                    res.redirect('cms/user');
                } else {
                    res.css('css/cms/cms/profile.css');
                    res.js(['js/cms/cms/profile.js', 'js/cms/cms/context.js']);
                    res.print('cms/cms/profile', {
                        profile: req.profile.toJSON(false),
                        restrictive: restrictive
                    });
                }
            });
    }

    static addRole(Role, req, res) {
        Role
            .findOneBy('name', req.roleName)
            .then(role => {
                req.profile.addRole(role);
                return req.profile.save();
            })
            .then(() => {
                return res.api(req.profile);
            }, error => {
                console.error(error.message);
                console.error(error.stack);
                return res.error(error);
            });
    }

    static updateName(req, res) {
        req.profile.name = req.body.name;
        req.profile
            .save()
            .then(() => {
                return res.api(req.profile);
            }, error => {
                console.error(error.message);
                console.error(error.stack);
                return res.error(error);
            });
    }

    static removeRole(Role, req, res) {
        Role
            .findOneBy('name', req.roleName)
            .then(role => {
                req.profile.removeRole(role);
                return req.profile.save();
            })
            .then(() => {
                return res.api(req.profile);
            }, error => {
                console.error(error);
                return res.error(error);
            });
    }

    static createUser(Role, req, res) {
        Role
            .find()
            .then(roles => {
                res.css('css/cms/cms/table.css');
                res.js('js/cms/cms/new-user.js');
                res.print('cms/cms/user-create', {roles: roles});
            }, error => {
                console.error(error);
                return res.error(error);
            });
    }

    static create(User, config, mailer, req, res) {
        var create = {},
            user;
        create.name = req.body.name;
        create.email = req.body.email;
        create.roles = [req.body.role];
        create.cms = true;

        User.exists(create.email)
            .then((exists) => {
                if (!exists) {
                    User.generator(JSON.parse(JSON.stringify(create)))
                        .then(createdUser => {
                            user = createdUser;
                            return user.passwordToken(create.email, 168);
                        })
                        .then(token => {
                            return mailer({
                                subject: 'Account Created on ' + config.get('host'),
                                from: config.get('mailer.from'),
                                to: create.email,
                                template: 'cms/users/emails/create-password',
                                token: token,
                                name: user._doc.name,
                                id: user._doc.id
                            });
                        })
                        .then(() => {
                            res.api({
                                status: 'success',
                                msg: 'User created'
                            });
                        }, error => {
                            res.error(error);
                        });
                } else {
                    res.api({
                        status: 'error',
                        msg: 'User already exists'
                    });
                }
        });
    }

    static passwordValidate(User, req, res) {
        let user;
        User.findById(req.params.passwordUid)
            .then((usr) => {
                user = usr;
                return user.validateToken(req.params.passwordToken, 'password');
            })
            .then(() => {
                user.setType = 'Create';
                res.css('css/cms/cms/table.css');
                res.js('js/cms/users/reset-password.js');
                res.print('cms/users/set-password', user);
            }, (error) => {
                res.error(error);
            });
    }

    static setPassword(User, req, res) {
        let user;
        User.findById(req.params.passwordUid)
            .then((usr) => {
                user = usr;
                return user.invalidatePasswordToken(req.params.passwordToken);
            })
            .then(() => {
                user.password = req.body.password;
                user.save();
                req.login(user, function (error) {
                    if (error) {
                        /* istanbul ignore next */
                        res.status(400).error(error);
                    } else {
                        SUtils.cmsMod('analytics').path('server/lib/collector').then(c => c.log('session:perday:' + user.id));
                        res.redirect('/');
                    }
                });
            }, (error) => {
                res.error(error);
            });
    }
}

module.exports = UserController;
