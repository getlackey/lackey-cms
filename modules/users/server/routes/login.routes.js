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

const policy = require('../policies/auth'),
    SUtils = require(LACKEY_PATH).utils,
    SCli = require(LACKEY_PATH).cli,
    __MODULE_NAME = 'lackey-cms/modules/users/server/routes';

module.exports = (server) => {

    return SUtils
        .waitForAs('login routes',
            require('../controllers/account')
        )
        .then((AccountController) => {

            server.route('/session').get((req, res) => {
                res.print('cms/users/session', {});
            });

            server.route('/cms/account')
                .get(server.acl, AccountController.index);

            server.route('/api/account/confirm-email')
                .post(policy.loggedIn, AccountController.sendConfirmationEmail);

            server.route('/api/account/password')
                .post(policy.loggedIn, AccountController.changePassword);

            server.route('/cms/account/forgot-password')
                .get(policy.anonymous('/'), AccountController.forgotIndex);
            server.route('/api/account/forgot-password')
                .post(policy.anonymous('/'), AccountController.forgot);

            server.route('/cms/account/reset-password')
                .get(policy.anonymous('/'), AccountController.resetIndex);

            server.route('/api/account/identity')
                .post(policy.loggedIn, AccountController.createIdentity);

            server.param('forgotPasswordToken', (req, res, next, id) => {
                SCli.debug(__MODULE_NAME, 'forgotPasswordToken', id);
                req.forgotPasswordToken = id;
                next();
            });

            server.param('forgotPasswordUid', (req, res, next, id) => {
                SCli.debug(__MODULE_NAME, 'forgotPasswordUid', id);
                req.forgotPasswordUid = id;
                next();
            });

            server.route('/api/me')
                .get(policy.loggedIn, AccountController.me)
                .put(policy.loggedIn, AccountController.update);

            server.get('/cms/account/token/:forgotPasswordToken/:forgotPasswordUid', policy.anonymous('/'), AccountController.forgotValidate);

        });
};
