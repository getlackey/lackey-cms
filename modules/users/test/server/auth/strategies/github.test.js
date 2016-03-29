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

var should = require('should'),
    dbsInit = require('../../../../../../test/mockup/dbs'),
    strategy,
    accessTokenValidNew = 'accessTokenValidNew',
    accessTokenValidExists = 'accessTokenValidExists',
    profile = {
        id: '123456',
        displayName: 'Ted the Bear',
        emails: [{
            value: 'ted@bazinga.com'
        }],
        username: 'theted',
        _json: {
            id: '123456',
            avatar_url: 'scarletjohannson.png',
            url: 'http://lovelovelove'
        }
    },
    UserMockup = {
        oAuthHandle: function (userObject, providerName, providerDataId, accessToken, refreshToken, providerData, userData, callback) {
            try {
                should(userObject).eql('Ted');
                should(providerName).eql('github-enterprise');
                should(providerDataId).eql(profile.id);
                should(refreshToken).eql('refreshToken');

                var profileExp = {
                    firstName: 'Ted',
                    lastName: 'the Bear',
                    displayName: 'Ted the Bear',
                    email: 'ted@bazinga.com',
                    username: 'theted',
                    profileImageURL: 'scarletjohannson.png',
                    provider: 'github-enterprise',
                    providerIdentifierField: 'id',
                    providerData: {
                        id: '123456',
                        avatar_url: 'scarletjohannson.png',
                        url: 'http://lovelovelove'
                    },
                    uri: 'http://lovelovelove'
                };

                should(userData).eql(profileExp);
                should(providerData).eql({
                    id: '123456',
                    avatar_url: 'scarletjohannson.png',
                    url: 'http://lovelovelove'
                });
            } catch (ex) {
                /* istanbul ignore next */
                return callback(ex);
            }
            callback(null, userData, accessToken === accessTokenValidNew);
        }
    },
    provider = {
        name: 'github-enterprise'
    };

describe('modules/users/server/auth/strategies/github', function () {

    before((done) => {
        dbsInit(() => {
            strategy = require('../../../../server/auth/dynamic-strategies/github');
            done();
        });
    });

    it('Handles valid token for new User', function (next) {

        var
            users = {
                saveOAuthUserProfile: function (err, user, isNew, callback) {
                    try {
                        should.not.exist(err);
                        should(user.uri).eql('http://lovelovelove');
                        should(isNew).be.True;
                    } catch (ex) {
                        /* istanbul ignore next */
                        return callback(ex);
                    }
                    callback();
                }
            },
            req = {
                user: 'Ted'
            },
            done = function (err) {
                next(err);
            };

        strategy.handler(provider, UserMockup, users)(req, accessTokenValidNew, 'refreshToken', profile, done);
    });

    it('Handles valid token for existing User', function (next) {

        var
            users = {
                saveOAuthUserProfile: function (err, user, isNew, callback) {
                    try {
                        should.not.exist(err);
                        should(user.uri).eql('http://lovelovelove');
                        should(isNew).be.False;
                    } catch (ex) {
                        /* istanbul ignore next */
                        return callback(ex);
                    }
                    callback();
                }
            },
            req = {
                user: 'Ted'
            },
            done = function (err) {
                next(err);
            };

        strategy.handler(provider, UserMockup, users)(req, accessTokenValidExists, 'refreshToken', profile, done);
    });

    it('Setups', function() {
        strategy({
            name : 'githug',
            clientID: 'test',
            clientSecret: 'test'
        });
    });
});
