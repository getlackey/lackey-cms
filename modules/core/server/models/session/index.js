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
    SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    Model = objection.Model,
    SCli = require(LACKEY_PATH).cli,
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/session',
    KNEX = require('../knex');

SCli.debug(__MODULE_NAME, 'REQUIRED');

module.exports = SUtils
    .waitForAs(
        __MODULE_NAME,
        SUtils.cmsMod('core').model('objection'),
        SUtils.cmsMod('core').model('user'),
        KNEX
    )
    .then((ObjectionWrapper, User) => {
        SCli.debug(__MODULE_NAME, 'READY');

        class SessionModel extends Model {
            static get tableName() {
                return 'sessions';
            }
        }

        class Session extends ObjectionWrapper {

            static get api() {
                return '/cms/session';
            }

            static get model() {
                return SessionModel;
            }

            static findById(id) {
                SCli.debug(__MODULE_NAME, 'findById', this.model.tableName, id);
                if (!id) {
                    return Promise.resolve(null);
                }
                return this.findOneBy('sid', id);
            }

            static removeAll(userId, sid) {
                return SCli.sql(this.model.query().delete().where('userId', userId).whereNot('sid', sid));
            }


            remove() {
                let self = this;

                return SCli.sql(self.constructor.model
                    .query()
                    .where('sid', self._doc.sid)
                    .del()
                ).then((result) => result);
            }


            toJSON() {
                return {
                    sid: this._doc.sid,
                    sess: this._doc.sess,
                    expired: this._doc.expired,
                    browser: this._doc.browser,
                    os: this._doc.os,
                    device: this._doc.device,
                    ipAddress: this._doc.ipAddress
                };
            }

            _humanTimestamp(timestamp) {
                let time = Math.round(((new Date() - timestamp) / 60000));

                if (time < 30) {
                    return time + ' minutes ago';
                } else if (time < 60) {
                    return 'less than an hour ago';
                } else if (time < 1440) {
                    return Math.round(time / 60) + ' hours ago';
                } else {
                    return Math.round(time / 1440) + ' days ago';
                }
            }

            _populate() {
                let self = this,
                    lastActive = self._doc.expired;

                lastActive.setDate(lastActive.getDate() - 1);
                self._doc.lastActive = lastActive;
                self._doc.humanLastActive = this._humanTimestamp(lastActive);

                return User
                    .findById(self._doc.userId)
                    .then((user) => {
                        self._user = user;

                        return self;
                    });
            }
        }

        return Session;
    });
