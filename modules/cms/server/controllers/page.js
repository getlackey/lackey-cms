/* jslint esnext:true, node:true */
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

const SCli = require(LACKEY_PATH).cli;

module.exports = require('../models/content')
    .then((Model) => {
        return {
            capture: (req, res, next) => {

                let route = req.route.replace(/\..*$/, ''),
                    fullPath = req.protocol + '://' + req.get('host') + route,
                    path;

                route = route.replace(/\?.*$/, '');

                if (route === '') {
                    route = '/';
                }

                route = decodeURIComponent(route);

                Model
                    .findByRoute(route)
                    .then((page) => {
                        if (page) {

                            let javascripts = req.user ? [
                                    'js/cms/cms/page.js'
                                ] : [],
                                stylesheets = [],
                                pageJson = page.toJSON();

                            if (pageJson.template) {
                                if (pageJson.template.javascripts) {
                                    javascripts = javascripts.concat(pageJson.template.javascripts);
                                }
                                if (pageJson.template.stylesheets) {
                                    stylesheets = stylesheets.concat(pageJson.template.stylesheets);
                                }
                            }

                            res.css(stylesheets);
                            res.js(javascripts);

                            path = page.getTemplatePath();

                            SCli.debug('lackey-cms/modules/cms/server/controllers/page', path);

                            if (req.query.variant && req.query.variant) {
                                if (req.user && req.user.getACL('viewInContext')) {
                                    path = req.query.variant;
                                }
                            }

                            res.edit(req.user && req.user.getACL('edit').length > 0);

                            res.print(path, {
                                route: fullPath,
                                content: pageJson
                            });

                            return;
                        }
                        next();
                    });

            }
        };
    });
