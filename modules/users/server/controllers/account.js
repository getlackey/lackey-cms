/* jslint node:true, esnext:true */
/* global LACKEY_PATH */
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

const mailer = require(LACKEY_PATH).mailer,
    configuration = require(LACKEY_PATH).configuration,
    SCli = require(LACKEY_PATH).cli,
    SUtils = require(LACKEY_PATH).utils,
    __MODULE_NAME = 'lackey-cms/modules/user/server/controllers/account';

module.exports = SUtils.waitForAs(__MODULE_NAME,
        SUtils.cmsMod('core').model('user'),
        SUtils.cmsMod('core').model('session')
    )
    .then((User, Session) => {
        return {
            index: (req, res) => {

                let data = {};

                req.admin
                    .getIdentities('email')
                    .then((emails) => {
                        data.emails = emails.map((email) => {
                            return {
                                email: email.accountId,
                                confirmed: email.confirmed
                            };
                        });
                        return data;
                    })
                    .then(() => {
                        return Session.findBy('userId', req.admin._doc.id);
                    })
                    .then((sessions) => {
                        data.sessions = sessions;
                        data.currentSession = req.session.id;

                        res.js('js/cms/users/account.js');
                        res.print('cms/users/account', data);
                    });
            },
            /**
             *
             */
            sendConfirmationEmail: (req, res) => {
                let lib, config;
                SCli.debug(__MODULE_NAME, 'Respond');
                configuration()
                    .then((cfg) => {
                        SCli.debug(__MODULE_NAME, 'Got config');
                        config = cfg;
                        return mailer();
                    })
                    .then((mail) => {
                        SCli.debug(__MODULE_NAME, 'Got mailer');
                        lib = mail;
                        return req.user.getIdentity('email', req.body.email);
                    })
                    .then((email) => {
                        if (!email) {
                            return res.error403('Nasty nasty one');
                        }
                        SCli.debug(__MODULE_NAME, 'Got email');
                        return lib({
                            from: config.get('mailer.from'),
                            to: email.accountId,
                            template: ['cms/users/emails/confirm-email']
                        });
                    })
                    .then((success) => {
                        res.api(success);
                    }, (error) => {
                        res.error(error);
                    });
            },
            forgotIndex: (req, res) => {
                res.js('js/cms/users/forgot.js');
                res.print(['~/core//forgot-password', 'cms/users/forgot-password']);
            },
            resetIndex: (req, res) => {
                res.js('js/cms/users/reset.js');
                res.print(['~/core/reset-password', 'cms/users/reset-password']);
            },
            forgot: (req, res) => {
                let userId;
                if (!req.body.username.length) { //TODO improve
                    throw(new Error('Email not found'));
                }
                User.getByProvider(User.EMAIL, req.body.username)
                    .then((user) => {
                        if (!user) {
                            throw new Error('Email not found');
                        }
                        userId = user.id;
                        return user.loginToken(req.body.username);
                    })
                    .then((token) => {
                        return mailer({
                            to: req.body.username,
                            template: ['~/core//emails/forgot-password', 'cms/users/emails/forgot-password'],
                            token: token,
                            id: userId,
                            subject: 'CMS Forgotten Password'
                        });
                    })
                    .then(() => {
                        return res.api('ok');
                    }, (error) => {
                        return res.status(400).api(error);
                    });
            },
            forgotValidate: (req, res) => {
                let user;
                User.findById(req.forgotPasswordUid)
                    .then((usr) => {
                        user = usr;
                        return user.invalidateToken(req.forgotPasswordToken);
                    })
                    .then(() => {
                        req.login(user, function (error) {
                            if (error) {
                                /* istanbul ignore next */
                                res.status(400).error(error);
                            } else {
                                SUtils.cmsMod('analytics').path('server/lib/collector').then(c => c.log('session:perday:' + user.id));
                                res.redirect('cms/account');
                            }
                        });
                    }, (error) => {
                        res.error(error);
                    });
            },
            changePassword: (req, res) => {
                req.admin.password = req.body.password;
                req.admin.save()
                    .then(() => {
                        res.api('ok');
                    });
            },
            me: (req, res) => {
                res.api(req.admin.toJSON());
            },
            update: (req, res) => {
                req.admin.update(req.body)
                    .then((data) => {
                        res.api(data);
                    }, (error) => {
                        res.error(error);
                    });
            },
            createIdentity: (req, res) => {
                req.admin.setIdentity('email', req.body.email, null, null, null, false, true)
                    .then(() => {
                        let data = {};
                        req.admin
                            .getIdentities('email')
                            .then((emails) => {
                                data.emails = emails.map((email) => {
                                    return {
                                        email: email.accountId,
                                        confirmed: email.confirmed
                                    };
                                });
                                res.api(data);
                            });
                    }, (error) => {
                        return res.status(400).api(error);
                    });
            },
            removeIdentity: (req, res) => {
                req.admin.getIdentities('email')
                    .then((identities) => {
                        let confCount = 0,
                            confirmed = false;
                            identities.forEach(function (identity) {
                                if (identity.confirmed) {
                                    confCount += 1;
                                }
                                if (identity.accountId === req.body.email && identity.confirmed) {
                                    confirmed = true;
                                }
                            });

                        if (confirmed && confCount < 2) {
                            return res.status(400).api({data: 'Can not delete last confirmed email'});
                        } else {
                            req.admin.removeIdentity('email', req.body.email)
                                .then(() => {
                                    let data = {};
                                    req.admin
                                        .getIdentities('email')
                                        .then((emails) => {
                                            data.emails = emails.map((email) => {
                                                return {
                                                    email: email.accountId,
                                                    confirmed: email.confirmed
                                                };
                                            });
                                            res.api(data);
                                        });
                                }, (error) => {
                                    return res.status(400).api(error);
                                });
                        }
                    });

            }
        };
    });
