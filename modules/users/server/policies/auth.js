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
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../lib';
}

var ACL = require('acl'),
    SCli = require(LACKEY_PATH).cli,
    MemoryBackend = ACL.memoryBackend;

/**
 * Create policy checker
 */
exports.generateIsAllowed = function (acl, field) {
    return function (req, res, next) {

        let roles = (req[field] ? req[field].getRoleNames() : null) || ['guest'],
            path = req.route.path.replace('*', '.*');

        if (!roles || !roles.length) {
            roles = ['guest'];
        }

        SCli.debug('lackey-cms/modules/users/server/policies/auth', 'Excercise ACL rule ', roles, path, req.method.toLowerCase());

        // Check for user roles
        acl.areAnyRolesAllowed(roles, path, req.method.toLowerCase(), function (err, isAllowed) {

            if (err) {
                // it's acl problem
                /* istanbul ignore next */
                // An authorization error occurred.
                return res.error(req, 'Unexpected authorization error');
            }

            if (isAllowed) {
                SCli.debug('lackey-cms/modules/users/server/policies/auth', 'ALLOWED', roles, req.method.toLowerCase());
                return next();
            }
            SCli.debug('lackey-cms/modules/users/server/policies/auth', 'NOT ALLOWED', roles, req.method.toLowerCase());
            return res.error403(req, {
                message: 'User is not authorized'
            });

        });

    };
};

let roleACL = new ACL(new MemoryBackend());

roleACL.allow('*', '/', 'get');

exports.setRoleAcl = (role, path, methods) => {
    let amendedPath = path.replace(/\*/g, '.*');
    SCli.debug('lackey-cms/modules/users/server/policies/auth', 'Define ACL rule ', role, amendedPath, methods);
    roleACL.allow(role, amendedPath, methods);
};

exports.roleAcl = exports.generateIsAllowed(roleACL, 'user');
exports.adminRoleAcl = exports.generateIsAllowed(roleACL, 'admin');

exports.anonymous = (redirect) => {
    return (req, res, next) => {
        if (req.user) {
            return res.redirect(redirect);
        }
        next();
    };
};

exports.loggedIn = (req, res, next) => {
    if (!req.user) {
        SCli.debug('lackey-cms/modules/users/server/policies/auth', 'loggedIn', 'No user');
        return res.error403(req, {
            message: 'User is not authorized'
        });
    }
    SCli.debug('lackey-cms/modules/users/server/policies/auth', 'loggedIn', 'yes');
    next();
};
