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
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../lib';
}

const session = require('express-session'),
    PostgresStore = require('connect-session-knex')(session),
    passport = require('passport'),
    SCli = require(LACKEY_PATH).cli,
    DBs = require(LACKEY_PATH).datasources,
    roleFilter = require('./server/lib/dust/role');

module.exports = (instance) => {

    instance.addDustHelper(roleFilter);

    instance.addMiddleware((app) => {

        SCli.debug('lackey-cms/modules/users', 'Adding middleware');

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
        app.decorateMiddleware([passport.initialize()], 'passport.initialize');

        app.decorateMiddleware([passport.session()], 'passport.session');

        app.acl = module.exports.acl;
        app.aclAdmin = module.exports.aclAdmin;

        SCli.debug('lackey-cms/modules/users', 'Adding middleware', app.acl);
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

module.exports.viewAs = (req, res, next) => {

    require('./server/models/role').then((Role) => {

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
        return next();

    });
};
