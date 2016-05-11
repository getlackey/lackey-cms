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
var passport = require('passport'),
    SUtils = require(LACKEY_PATH).utils,
    User = SUtils.cmsMod('core').model('user'),
    usersAuthController = require('../../controllers/authentication'),
    GithubStrategy = require('passport-github').Strategy;

module.exports = function (provider) {
    // Use github strategy
    passport.use(provider.name, new GithubStrategy({
            clientID: provider.clientID,
            clientSecret: provider.clientSecret,
            callbackURL: '/api/auth/' + provider.name + '/callback',
            passReqToCallback: true
        },
        module.exports.handler(provider, User, usersAuthController)
    ));
};

module.exports.handler = function (provider, UserClass, users) {
    return function (req, accessToken, refreshToken, profile, done) {
        // Set the provider data and include tokens

        var providerData = profile._json;

        // Create the user OAuth profile
        var displayName = profile.displayName.trim();
        var iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
        var firstName = iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
        var lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';

        var userData = {
            firstName: firstName,
            lastName: lastName,
            displayName: displayName,
            email: profile.emails[0].value,
            username: profile.username,
            profileImageURL: (providerData.avatar_url) ? providerData.avatar_url : undefined,
            provider: provider.name,
            providerIdentifierField: 'id',
            providerData: providerData,
            uri: providerData.url
        };

        // Save the user OAuth profile
        UserClass.oAuthHandle(req.user, provider.name, providerData.id, accessToken, refreshToken, providerData, userData, function (err, user, isNew) {
            users.saveOAuthUserProfile(err, user, isNew, done);
        });
    };
};
