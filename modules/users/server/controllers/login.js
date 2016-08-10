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

const passport = require('passport'),
      SUtils = require(LACKEY_PATH).utils;

module.exports = Promise.resolve({

    index: (req, res) => {
        res.print(['~/core/login', 'cms/users/login'], {});
    },

    logout: (req, res) => {
        req.logout();
        res.redirect('/');
    },

    login: (req, res, next) => {
        if (req.body && req.body.remember > 0) {
            req.session.cookie.maxAge = req.body.remember * 86400000;
        }
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                /* istanbul ignore next */
                res.status(400).error(err);
            } else if (!user) {
                res.status(400).error(new Error('Invalid credentials: ' + JSON.stringify(info, null, 4)));
            } else {
                // Remove sensitive data before login
                req.login(user, (error) => {
                    if (error) {
                        /* istanbul ignore next */
                        res.status(400).error(error);
                    } else {
                        SUtils.cmsMod('analytics').path('server/lib/collector').then(c => c.log('session:perday:' + user.id));
                        res.redirect('/');
                    }
                });
            }
        })(req, res, next);

    }
});
