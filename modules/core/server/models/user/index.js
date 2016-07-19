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
    SCli = require(LACKEY_PATH).cli,
    SUtils = require(LACKEY_PATH).utils,
    gravatar = require('gravatar'),
    crypto = require('crypto'),
    objection = require('objection'),
    Model = objection.Model,
    _ = require('lodash'),
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/user';

SCli.debug(__MODULE_NAME, 'REQUIRED');

/**
 * @module lackey-cms/modules/core/server/models/user
 */

module.exports = SUtils
    .waitForAs(__MODULE_NAME,
        SUtils.cmsMod('core').model('taggable'),
        require('../role'),
        require('../knex')
    )
    .then((Taggable, Role) => {

        SCli.debug(__MODULE_NAME, 'READY');

        /**
         * @class ACL
         * @extends Objection.Model
         */
        class ACL extends Model {
            static get tableName() {
                return 'acl';
            }
        }

        /**
         * @class UserModel
         * @extends Objection.Model
         */
        class UserModel extends Model {
            static get tableName() {
                return 'users';
            }
        }

        /**
         * @class Identities
         * @extends Objection.Model
         */
        class Identities extends Model {
            static get tableName() {
                return 'identities';
            }
        }

        class Tokens extends Model {
            static get tableName() {
                return 'tokens';
            }
        }

        class UserToTaxonomy extends Model {
            static get tableName() {
                return 'userToTaxonomy';
            }
        }

        /**
         * @class User
         * @extends lackey-cms/modules/core/server/models/objection
         */
        class User extends Taggable {

            static get api() {
                return '/cms/user';
            }

            static get taxonomyRelationModel() {
                return UserToTaxonomy;
            }

            static get taxonomyRelationField() {
                return 'taxonomyUserId';
            }

            constructor(data) {
                    super(data);
                    this._roles = this._roles || [];
                }
                /**
                 * Creates new user
                 * @param   {object}   data
                 * @param   {string}   data.name
                 * @param   {string}   data.email
                 * @param   {string}   data.password
                 * @override lackey-cms/modules/core/server/models/objection#create
                 * @returns {Promise} of instance
                 */
            static create(data) {

                SCli.debug(__MODULE_NAME, 'Create', JSON.stringify(data));

                if (!data) {
                    return Promise.reject(new Error('No data given'));
                }

                if (!data.name) {
                    return Promise.reject(new Error('No name given'));
                }

                if (!data.email) {
                    return Promise.reject(new Error('No email given'));
                }

                if (!data.password) {
                    return Promise.reject(new Error('No password given'));
                }

                return super.create.apply(this, [data]);
            }

            static get model() {
                return UserModel;
            }

            /**
             * Checks if user exists
             * @param {string} email
             * @returns Promise
             */
            static exists(email) {

                SCli.debug(__MODULE_NAME, 'exists', email);

                return SCli.sql(Identities
                    .query()
                    .count()
                    .where('provider', User.EMAIL)
                    .andWhere('accountId', email)
                ).then((result) => {
                    return +result[0].count === 1;
                });
            }

            _populate() {
                let self = this;

                if (!this.id) {
                    return Promise.revole(this);
                }

                return super
                    ._populate()
                    .then(() => {
                        return self.getRoles();
                    })
                    .then(() => {
                        if (this._doc.avatar) {
                            return self._getAvatar();
                        }
                    })
                    .then(() => self._loadIdentities())
                    .then(() => {
                        return self;
                    });
            }

            _getAvatar() {

                SCli.debug(__MODULE_NAME, '_getAvatar');

                let self = this;
                return SUtils
                    .cmsMod('core')
                    .model('media')
                    .then((Media) => {
                        return Media
                            .findById(self._doc.avatar);
                    })
                    .then((avatar) => {
                        self._image = avatar;
                    });
            }

            _loadIdentities() {
                let self = this;
                return this
                    .getIdentities()
                    .then((list) => {
                        self.identities = list.map(identity => {
                            return {
                                id: identity.accountId,
                                type: identity.provider
                            };
                        });
                    });
            }

            _preSave(options) {

                if (this.preventSave) {
                    throw new Error('Save prevention');
                }

                if (!this.id) {
                    if (!this._doc.email && (!options || !options.noEmailRequired)) {
                        return Promise.reject(new Error('Missing credentials'));
                    }
                }

                let promise = super._preSave();

                if (this._doc.email) {
                    promise = promise
                        .then(this.bind(this._detectConflict, [User.EMAIL, this._doc.email]));
                }

                if (this._doc.username) {
                    promise = promise
                        .then(this.bind(this._detectConflict, [User.USERNAME, this._doc.username]));
                }

                if (this._doc.image) {
                    promise = promise
                        .then(this.bind(this._populateImage, [this._doc.image]));
                }

                return promise.then(this.bind(this._preSaveFinalize));
            }

            _populateImage(imagePath) {

                SCli.debug(__MODULE_NAME, '_populateImage');

                let self = this;
                return SUtils
                    .cmsMod('core')
                    .model('media')
                    .then((Media) => {
                        return Media.generator(imagePath);
                    })
                    .then((image) => {
                        self._doc.avatar = image.id;
                        delete self._doc.image;
                    });
            }

            _detectConflict(provider, id) {

                SCli.debug(__MODULE_NAME, '_detectConflict', this.id, provider, id);

                let self = this,
                    promise = Identities
                    .query()
                    .count()
                    .where('provider', provider)
                    .andWhere('accountId', id);
                if (this.id) {
                    promise = promise.whereNot('userId', this.id);
                }
                return SCli.sql(promise).then((result) => {
                    SCli.debug(__MODULE_NAME, '_detectConflict', result[0].count > 0);
                    if (result[0].count > 0) {
                        throw Error('This credentials are used by other user');
                    }
                    return self;
                });
            }

            _gravatar(email) {

                SCli.debug(__MODULE_NAME, '_gravatar', email);

                if (email) {

                    let image = gravatar.url(email.accountId, {
                        s: '250',
                        r: 'x',
                        d: 'retro'
                    }, true);

                    return SUtils
                        .cmsMod('core')
                        .model('media')
                        .then((Media) => {
                            return Media.generator(image);
                        })
                        .then((media) => {
                            this._doc.avatar = media.id;
                            return this.save();

                        });
                }
                return this;
            }

            _preSaveFinalize() {

                SCli.debug(__MODULE_NAME, '_preSaveFinalize');

                if (this._doc.password && this._doc.password.length > 6) {
                    this.password = this._doc.password;
                }

                delete this._doc.email;
                delete this._doc.password;
                delete this._doc.roles;
                delete this._doc.username;
                delete this._doc.confirmed;
                delete this._doc.stages;

                return Promise.resolve(this);
            }

            _postSave(cached) {

                SCli.debug(__MODULE_NAME, '_postSave');

                let promise = super._postSave(cached),
                    self = this;
                if (cached.email) {
                    promise = promise
                        .then((user) => {
                            return user
                                .setIdentity(User.EMAIL, cached.email, null, null, null, cached.confirmed === true);
                        });
                }
                if (cached.username) {
                    promise = promise.then(
                        (user) => {
                            return user
                                .setIdentity(User.USERNAME, cached.username, null, null, null, cached.confirmed === true);
                        });
                }
                if (!this._doc.avatar) {
                    promise = promise
                        .then(this.bind(this.getIdentity, [User.EMAIL]))
                        .then(this.bindCapture(this._gravatar));
                }

                if (cached.roles) {
                    promise = promise
                        .then(() => {
                            return SCli.sql(ACL
                                .query()
                                .delete()
                                .where('userId', self.id));
                        })
                        .then(() => {
                            return SCli.sql(ACL
                                .query()
                                .insert(cached.roles.map((role) => {
                                    return {
                                        roleId: role,
                                        userId: self.id
                                    };
                                })));
                        });
                }
                return promise;
            }

            loginToken(email) {

                SCli.debug(__MODULE_NAME, 'loginToken');

                let EXPIRE = new Date((new Date()).getTime() + (1000 * 60 * 60 * 24)),
                    algorithm = 'aes256', // or any other algorithm supported by OpenSSL
                    text = {
                        id: this.id,
                        email: email,
                        expire: EXPIRE.getTime()
                    },
                    cipher = crypto.createCipher(algorithm, this._doc.salt),
                    token = cipher.update(JSON.stringify(text), 'utf8', 'hex') + cipher.final('hex');

                return SCli.sql(Tokens
                        .query()
                        .insert({
                            userId: this.id,
                            expire: EXPIRE,
                            used: false,
                            type: 'login',
                            token: token
                        }))
                    .then(() => {
                        return token;
                    });
            }

            invalidateToken(token) {

                SCli.debug(__MODULE_NAME, 'invalidateToken');

                let self = this;
                return SCli.sql(Tokens
                        .query()
                        .where('userId', this.id)
                        .where('expire', '>=', new Date())
                        .where('used', false)
                        .where('type', 'login')
                        .where('token', token))
                    .then((list) => {
                        if (!list || !list.length) {
                            throw Error('Invalid token');
                        }
                        return SCli.sql(Tokens
                                .query()
                                .where('userId', this.id)
                                .where('type', 'login')
                                .where('token', token))
                            .update({
                                'used': true
                            });
                    })
                    .then(() => {
                        return self;
                    });
            }

            decodeLoginToken(token) {

                SCli.debug(__MODULE_NAME, 'decodeLoginToken');

                let algorithm = 'aes256',
                    decipher = crypto.createDecipher(algorithm, this._doc.salt);
                return JSON.parse(decipher.update(token, 'hex', 'utf8') + decipher.final('utf8'));
            }

            /**
             * Gets user by provider (and optinally account id)
             * @param   {string} provider
             * @param   {string} uid
             * @returns {Promise} of instance or null
             */
            static getByProvider(provider, uid) {

                SCli.debug(__MODULE_NAME, 'Get by provider', provider, uid);

                let query = Identities
                    .query();

                if (Array.isArray(provider)) {
                    query = query.whereIn('provider', provider);
                } else {
                    query = query.where('provider', provider);
                }

                if (uid) {
                    query = query.andWhere('accountId', uid);
                }

                return SCli.sql(query)
                    .then((record) => {
                        if (record.length) {
                            SCli.debug(__MODULE_NAME, 'Get by provider', record[0].userId);
                            return User
                                .findById(record[0].userId);
                        }
                        return null;
                    });

            }

            static findUniqueUsername(username, suffix) {

                SCli.debug(__MODULE_NAME, 'findUniqueUsername', username, suffix);

                let self = this,
                    possibleUsername = username + (suffix || '');

                return self
                    .getByProvider(self.USERNAME, possibleUsername)
                    .then((user) => {
                        if (!user) {
                            return possibleUsername;
                        } else {
                            return self
                                .findUniqueUsername(username, (suffix || 0) + 1);
                        }
                    });
            }

            static oAuthHandle(currentUser, provider, id, accessToken, refreshToken, providerData, userData, callback) {

                SCli.debug(__MODULE_NAME, 'oAuthHandle', provider, id);

                let self = this,
                    promise;

                if (!currentUser) {
                    promise = self.oAuthHandleNotLoggedIn(provider, id, accessToken, refreshToken, providerData, userData);
                } else {
                    promise = currentUser
                        .setIdentitySafe(provider, id, accessToken, refreshToken, providerData);
                }
                return promise.then((user) => {
                    return callback(null, user, '/');
                }, callback);
            }

            static oAuthHandleNotLoggedIn(provider, id, accessToken, refreshToken, providerData, userData) {

                SCli.debug(__MODULE_NAME, 'oAuthHandleNotLoggedIn');

                let self = this;

                return this
                    .getByProvider(provider, id)
                    .then((user) => {
                        if (!user) {

                            SCli.debug(__MODULE_NAME, 'oAuthHandleNotLoggedIn', 'no user found');

                            let foundUser,
                                possibleUsername = userData.username || ((userData.email) ? userData.email.split('@')[0] : '') || userData.name;

                            return self.findUniqueUsername(possibleUsername, null)
                                .then((availableUserName) => {
                                    possibleUsername = availableUserName;
                                    foundUser = new User(userData);
                                    return foundUser.save({
                                        noEmailRequired: true
                                    });
                                }).then(() => {
                                    return foundUser
                                        .setIdentitySafe(provider, id, accessToken, refreshToken, providerData);
                                }).then(() => {
                                    return foundUser.setIdentity(Model.USERNAME, possibleUsername, null, null, null);
                                });
                        }

                        SCli.debug(__MODULE_NAME, 'oAuthHandleNotLoggedIn', 'user found');

                        return user
                            .setIdentitySafe(provider, id, accessToken, refreshToken, providerData);
                    });

            }

            isIdentityConfirmed(provider, id) {

                SCli.debug(__MODULE_NAME, 'isIdentityConfirmed', provider, id);
                return SCli.sql(Identities
                    .query()
                    .count()
                    .where('userId', this.id)
                    .andWhere('provider', provider)
                    .andWhere('accountId', id)
                    .andWhere('confirmed', true)
                ).then((result) => {
                    return +result[0].count === 1;
                });
            }

            setIdentityConfirmed(provider, id, confirmed) {

                SCli.debug(__MODULE_NAME, 'setIdentityConfirmed', provider, id, confirmed);

                let query = Identities
                    .query()
                    .where('userId', this.id)
                    .andWhere('provider', provider);

                if (id !== null) {
                    query = query.andWhere('accountId', id);
                }

                return SCli
                    .sql(query.update({
                        confirmed: confirmed
                    }))
                    .then(() => {
                        SCli.debug(__MODULE_NAME, 'setIdentityConfirmed', 'done');
                        return true;
                    });
            }

            /**
             * Gets list of roles
             * @returns {Promise} of Roles
             */
            getRoles() {

                SCli.debug(__MODULE_NAME, 'getRoles');

                let self = this;
                return SCli
                    .sql(ACL.query()
                        .where('userId', this.id)
                    )
                    .then((records) => {
                        return Role.findByIds(records.map((record) => {
                            return record.roleId;
                        }));
                    })
                    .then((roles) => {
                        self._roles = roles;
                        return roles;
                    });
            }

            /**
             * Gets list of role names
             * @returns {Promise} of strings
             */
            getRoleNames() {

                SCli.debug(__MODULE_NAME, 'getRoleNames');

                return this.roles.map((role) => {
                    return role.name;
                });
            }

            /**
             * Gets combined ACL object
             * @param   {string} perm
             * @returns {Promise} or Object
             */
            getACL(perm) {

                SCli.debug(__MODULE_NAME, 'getACL');

                let perms = [];
                this.roles.forEach((role) => {
                    if (Array.isArray(role.acl[perm])) {
                        perms = perms.concat(role.acl[perm]);
                    } else if (role.acl[perm]) {
                        perms.push(role.acl[perm]);
                    }
                });
                return perms;

            }

            /**
             * Checks permission
             * @param   {string} perm
             * @param   {string} method
             * @returns {Promise<boolean>}
             */
            isAllowed(perm, method) {
                let roles = this.roles.map((role) => role.name);

                return SUtils
                    .cmsMod('users')
                    .policy('auth')
                    .then((policy) => {
                        return new Promise((resolve, reject) => {
                            policy
                                .ACL
                                .areAnyRolesAllowed(roles, perm, method || '*', (err, isAllowed) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(isAllowed);
                                });
                        });
                    });

            }

            /**
             * Checks, if user has specific role
             * TODO improve using join
             * @param   {string} role
             * @returns {Promise} of Boolean
             */
            hasRole(role) {

                SCli.debug(__MODULE_NAME, 'hasRole');

                return this.getRoleNames().then((roleNames) => roleNames.indexOf(role) !== -1);
            }

            /**
             * Checks, if user has some of defined roels
             * @param   {array<string>} roles
             * @returns {boolean}
             */
            hasSomeRole(roles) {

                SCli.debug(__MODULE_NAME, 'hasSomeRole');

                return this.getRoleNames().then((roleNames) => {
                    for (let i = 0; i < roles.length; i++) {
                        if (roleNames.indexOf(roles[i])) {
                            return true;
                        }
                    }
                    return false;
                });
            }

            set password(value) {

                SCli.debug(__MODULE_NAME, 'set password');

                this._doc.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64').toString('base64');
                this._doc.hashedPassword = this.hashPassword(value);
            }

            get password() {
                return null;
            }

            get roles() {
                return this._roles;
            }

            get image() {
                return this._image;
            }

            get route() {
                return this._doc.route;
            }

            /**
             * Gets as specific role
             * @param   role
             */
            as(role) {
                SCli.debug(__MODULE_NAME, 'as', role.name ? role.name : role);
                let setRole = role,
                    user;
                if (typeof role === 'string') {
                    setRole = Role.getByName(role);
                }
                user = _.cloneDeep(this);
                user.preventSave = true;
                user._roles = [setRole];
                return user;
            }

            toJSON() {
                return {
                    name: this.name,
                    roles: this.roles,
                    route: this.route,
                    image: this.image ? this.image.toJSON() : null,
                    id: this.id,
                    taxonomies: this.taxonomies,
                    identities: this.identities
                };
            }

            hashPassword(password) {

                SCli.debug(__MODULE_NAME, 'hashPassword');

                if (this._doc.salt && password) {
                    return crypto.pbkdf2Sync(password, new Buffer(this._doc.salt, 'base64'), 10000, 64).toString('base64');
                } else {
                    /* istanbul ignore next - edge case as salt is defined on creation */
                    throw new Error('There is no salt on the table!');
                }
            }

            authenticate(password) {

                SCli.debug(__MODULE_NAME, 'authenticate');

                return this._doc.hashedPassword === this.hashPassword(password);
            }

            setIdentitySafe(provider, id) {

                SCli.debug(__MODULE_NAME, 'setIdentitySafe');

                let args = [].slice.call(arguments);
                return this
                    ._detectConflict(provider, id)
                    .then(this.bind(this.setIdentity, args));
            }

            setIdentity(provider, id, accessToken, refreshToken, providerData, confirmed) {

                SCli.debug(__MODULE_NAME, 'setIdentity', this.id, provider, id, accessToken, refreshToken, providerData, confirmed);

                if (!this.id) {
                    throw new Error('Can\'t add identity to unsaved user');
                }

                let self = this;

                return objection.transaction(Identities, function (BoundIdentities) {
                        return SCli
                            .sql(BoundIdentities
                                .query()
                                .where('userId', self.id)
                                .andWhere('provider', provider)
                                .andWhere('accountId', id)
                                .update({
                                    accessToken: accessToken || null,
                                    refreshToken: refreshToken || null,
                                    providerData: providerData || null,
                                    confirmed: confirmed || false
                                })
                            )
                            .then((count) => {
                                if (count > 0) return Promise.resolve(self);
                                SCli.debug(__MODULE_NAME, 'setIdentity', 'insert');
                                return SCli.sql(BoundIdentities
                                    .query()
                                    .insertAndFetch({
                                        accessToken: accessToken || null,
                                        refreshToken: refreshToken || null,
                                        providerData: providerData || null,
                                        userId: self.id,
                                        provider: provider,
                                        accountId: id,
                                        confirmed: confirmed || false
                                    }));
                            });
                    })
                    .then(() => self._loadIdentities())
                    .then(() => {
                        SCli.debug(__MODULE_NAME, 'setIdentity', 'done');
                        return self;
                    });
            }

            /**
             * Gets identity object by provider and or by id
             * @param   {string} provider
             * @param   {string} id
             * @returns {Promise}
             */
            getIdentity(provider, id) {

                SCli.debug(__MODULE_NAME, 'getIdentity', provider, id);

                let query = Identities.query()
                    .where('userId', this.id)
                    .andWhere('provider', provider);


                if (id !== undefined) {
                    query = query.andWhere('accountId', id);
                }

                return SCli.sql(query).then((list) => {
                    return User.formatIdentity(list.shift());
                });
            }

            getIdentities(provider, id) {
                SCli.debug(__MODULE_NAME, 'getIdentities', provider, id);

                let query = Identities.query()
                    .where('userId', this.id);

                if (provider !== undefined) {
                    query = query.andWhere('provider', provider);
                }

                if (id !== undefined) {
                    query = query.andWhere('accountId', id);
                }

                return SCli.sql(query).then((list) => {
                    return list.map(User.formatIdentity);
                });
            }

            static formatIdentity(identity) {

                SCli.debug(__MODULE_NAME, 'formatIdentity');

                if (!identity) {
                    return identity;
                }
                if (typeof identity.providerData === 'string') {
                    identity.providerData = JSON.parse(identity.providerData);
                }

                return identity;
            }

            static removeAll() {

                SCli.debug(__MODULE_NAME, 'removeAll');

                return super.removeAll()
                    .then(() => SCli.sql(Identities.query().delete()))
                    .then(() => SCli.sql(ACL.query().delete()));
            }

            removeIdentity(provider, id) {

                SCli.debug(__MODULE_NAME, 'removeIdentity', provider, id);

                return SCli
                    .sql(Identities
                        .query()
                        .delete()
                        .where('userId', this.id)
                        .where('provider', provider)
                        .where('accountId', id)
                    )
                    .then(() => this._loadIdentities())
                    .then(() => true);
            }

            removeOtherIdentity(provider, id) {

                SCli.debug(__MODULE_NAME, 'removeOtherIdentity', provider, id);

                return SCli
                    .sql(Identities
                        .query()
                        .delete()
                        .where('userId', this.id)
                        .where('provider', provider)
                        .whereNot('accountId', id)
                    )
                    .then(() => this._loadIdentities())
                    .then(() => true);
            }

            remove() {
                let self = this;
                return Promise
                    .all([
                    SCli.sql(Identities
                            .query()
                            .delete()
                            .where('userId', this.id)),
                    SCli.sql(Tokens
                            .query()
                            .delete()
                            .where('userId', this.id)),
                    SCli.sql(ACL
                            .query()
                            .delete()
                            .where('userId', this.id))
                    ])
                    .then(() => {
                        self._doc.deleted = true;
                        self._doc.name = 'Deleted user ' + self._doc.id;
                        self._doc.hashedPassword = '';
                        self._doc.title = '';
                        self._doc.bio = '';
                        self._doc.avatar = null;
                        return self.save();
                    });
            }
        }

        User.generator = require('./generator');
        User.EMAIL = 'email';
        User.USERNAME = 'username';

        return User;
    });
