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

const session = require('express-session'),
    PostgresStore = require('./server/lib/connect-session-knex')(session),
    passport = require('passport'),
    SCli = require(LACKEY_PATH).cli,
    SUtils = require(LACKEY_PATH).utils,
    DBs = require(LACKEY_PATH).datasources,
    roleFilter = require('./server/lib/dust/role'),
    __MODULE_NAME = 'lackey-cms/modules/users';
/**
 * @module lackey-cms/modules/users
 */

module.exports = (instance) => {

    SCli.debug(__MODULE_NAME, 'Init');

    instance.addDustHelper(roleFilter);

    instance.addMiddleware((app) => {

        SCli.debug(__MODULE_NAME, 'Adding middleware');

        let auth = require('./server/auth');

        passport.serializeUser(auth.serializeUser);
        passport.deserializeUser(auth.deserializeUser);

        require('./server/auth/strategies/local')(); // load local


        app.decorateMiddleware([session({
            secret: 'kitty kitty cat cat cat',
            store: new PostgresStore({
                knex: DBs.cached('knex', 'default'),
                tablename: 'sessions'
            }),
            saveUninitialized: true,
            resave: true
        })], 'session');
        app.decorateMiddleware([module.exports.setSession], 'setsession');
        app.decorateMiddleware([passport.initialize()], 'passport.initialize');

        app.decorateMiddleware([passport.session()], 'passport.session');

        app.acl = module.exports.acl;
        app.aclAdmin = module.exports.aclAdmin;

        SCli.debug(__MODULE_NAME, 'Adding middleware', app.acl);
        app.decorateMiddleware([module.exports.viewAs], 'viewas');

    });

};
module.exports.acl = (req, res, next) => {
    let policies = require('./server/policies/auth');
    policies.roleAcl(req, res, next);
};

module.exports.aclAdmin = (req, res, next) => {
    let policies = require('./server/policies/auth');
    policies.adminRoleAcl(req, res, next);
};

module.exports.setSession = (req, res, next) => {
    req.session.userAgent = req.headers['user-agent'];
    req.session.ipAddress = req.headers['x-client-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.session.cookie.maxAge = 3600000;
    req.session.save();
    return next();
};

module.exports.viewAs = (req, res, next) => {

    return SUtils
        .cmsMod('core')
        .model('role')
        .then((Role) => {

            let viewAsCookie = 'lky-view-as',
                viewAs,
                names,
                viewingAs;

            if (!req.user) {
                return next();
            }

            req.admin = req.user;
            viewAs = req.admin.getACL('viewas');

            if (viewAs.indexOf('*') !== -1) {
                viewAs = Role.all();
            } else {
                viewAs = viewAs.map((role) => Role.getByName(role));
            }

            res.viewAs = viewAs;

            if (!req.cookies || !req.cookies[viewAsCookie]) {
                return next();
            }

            names = viewAs.map((role) => role.name);

            viewingAs = req.cookies[viewAsCookie];

            if (names.indexOf(viewingAs) !== -1) {
                res.viewingAs = viewingAs;
                req.user = req.admin.as(viewingAs);
            }
            res.clearCookie(viewAsCookie);
            return next();

        });
};
