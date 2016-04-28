/*jslint node:true, unparam:true, regexp:true, esnext:true  */
'use strict';
/*
    Copyright 2015 Enigma Marketing Services Limited

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
    SCli = require('../../utils/cli'),
    SUtils = require('../../utils');

module.exports = (server) => {

    SCli.debug('lackey-cms/server/init/locale', 'Setting up');
    server.decorateMiddleware([module.exports.translate], 'locale');
};

module.exports.defaultLocale = 'en';

module.exports.translate = (req, res, next) => {

    req.locale = module.exports.defaultLocale;

    let pathParts = req.path.split('/');

    req.route = req.path;

    if (pathParts[1].match(/^[a-z]{2,3}(|-([a-zA-Z]+))(|-[A-Z]{2,3})(|-([0-9]+))$/)) {

        req.locale = pathParts[1];

        pathParts.splice(1, 1);

        req.route = pathParts.join('/') + '';
        if (req.route === '') {
            req.route = '/';
        }
    }

    if (req.cookies && req.cookies['lky-view-in']) {
        req.locale = req.cookies['lky-view-in'];
    }

    req.route = req.route.toLowerCase();

    console.log('route is ', typeof req.route, req.route);

    return SUtils
        .cmsMod('i18n')
        .model('language')
        .then((Language) => {
            return Language.default;
        })
        .then((code) => {
            req.defaultLocale = code;
            next();
        });


};
