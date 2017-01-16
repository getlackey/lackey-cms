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

class loginClass {

    static index(req, res) {
        res.js('js/cms/users/login.js');
        res.print(['~/core/login', 'cms/users/login'], {});
    }

    static logout(req, res) {
        req.logout();
        res.redirect('/');
    }

    static login(req, res, next) {
        if (req.body && req.body.remember > 0) {
            if (req.session) {
                req.session.cookie.maxAge = req.body.remember * 86400000;
            }
        } else if (req.session) {
            req.session.cookie.maxAge = 14400000;
        }
        passport.authenticate('local', (err, user) => {
            if (err) {
                /* istanbul ignore next */
                res.status(400).error(err);
            } else if (!user) {
                res.status(400).error(new Error('Invalid credentials'));
            } else {
                // Remove sensitive data before login
                req.login(user, (error) => {
                    if (error) {
                        /* istanbul ignore next */
                        res.status(400).error(error);
                    } else {
                        SUtils.cmsMod('analytics').path('server/lib/collector').then(c => c.log('session:perday:' + user.id));
                        res.api('done');
                    }
                });
            }
        })(req, res, next);

    }
}

module.exports = loginClass;
