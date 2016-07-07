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
    languageTags = require('language-tags'),
    SUtils = require('../../utils');

module.exports = (server) => {

    SCli.debug('lackey-cms/server/init/locale', 'Setting up');
    server.decorateMiddleware([module.exports.translate], 'locale');
};

module.exports.defaultLocale = 'en';

module.exports.translate = (req, res, next) => {

    req.locale = module.exports.defaultLocale;

    let route = req.route || req.path,
        pathParts;

    pathParts = route.split('/');

    req.route = route || req.path;

    if (route !== '/cms/preview' && route !== '/cms/preview.json') {

        if (languageTags(pathParts[1]).valid()) {

            console.log(__filename, pathParts[1]);
            req.locale = pathParts[1];

            pathParts.splice(1, 1);

            req.route = pathParts.join('/') + '';
            if (req.route === '') {
                req.route = '/';
            }
        } else if (languageTags(pathParts[1]).deprecated()) {
            return res.redirect(route.replace(pathParts[1], languageTags(pathParts[1]).preferred().format()));
        }
    }
    if (req.cookies && req.cookies['lky-view-in']) {
        req.locale = req.cookies['lky-view-in'];
    }


    req.route = req.route.toLowerCase();

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
