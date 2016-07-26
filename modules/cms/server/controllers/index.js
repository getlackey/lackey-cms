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

const SUtils = require(LACKEY_PATH).utils,
    SCli = require(LACKEY_PATH).cli,
    humanize = require('humanize'),
    MODULE_NAME = 'lackey-cms/modules/cms/server/controllers';

module.exports = SUtils
    .waitForAs('lackey-cms/modules/cms/server/controllers',
        SUtils.cmsMod('core').model('activity-log'),
        SUtils.cmsMod('core').model('role'),
        SUtils.cmsMod('i18n').model('language'),
        SUtils.cmsMod('core').model('template'),
        SUtils.cmsMod('core').model('content'),
        require('../lib/serializer'),
        require('json2yaml')
    )
    .then((Activity, Role, Language, Template, Content, Serializer, JSON2YAML) => {

        return {
            viewingAs: (req, res) => {
                res.api({
                    viewAs: res.viewAs || [],
                    viewingAs: res.viewingAs
                });
            },
            dashboard: (req, res) => {
                res.print('cms/cms/dashboard', {
                    memory: ((mem) => {
                        return {
                            rss: humanize.filesize(mem.rss),
                            heapTotal: humanize.filesize(mem.heapTotal),
                            heapUsed: humanize.filesize(mem.heapUsed)
                        };
                    })(process.memoryUsage())
                });
            },
            iframe: (req, res) => {
                try {
                    let iframePath, fullIframePath, variants;

                    iframePath = req.originalUrl.replace(/^\/admin/, '');

                    SCli.debug(MODULE_NAME, 'IFRAME path', iframePath);
                    SCli.debug(MODULE_NAME, 'IFRAME ADMIN path', fullIframePath);

                    if (iframePath === '') {
                        iframePath = iframePath + '/';
                    }

                    fullIframePath = req.__host + iframePath;

                    return Content
                        .findByRoute(iframePath.split('?')[0])
                        .then((page) => {
                            if (page) {
                                return page._template.canEdit(req.user);
                            }
                            return false;
                        })
                        .then((canEdit) => {
                            if (!canEdit) {
                                return res.redirect(fullIframePath);
                            }

                            return Template.getOfType('variant')
                                .then((_variants) => {
                                    variants = _variants;
                                    return Language.getEnabled();
                                })
                                .then((languages) => {
                                    res.edit(true);
                                    res.js('js/cms/cms/header.js');
                                    res.print('cms/cms/iframe', {
                                        page: fullIframePath,
                                        variants: variants.map((variant) => {
                                            return {
                                                path: variant.path,
                                                name: variant.name
                                            };
                                        }),
                                        langauges: languages
                                    });

                                });
                        })
                        .catch(error => console.error(error));
                } catch (e) {
                    console.error(e);
                }

            },
            activityStream: (req, res) => {

                Activity
                    .query()
                    .then((data) => {
                        res.print('cms/cms/activity-stream', {
                            list: data
                        });
                    }, (error) => {
                        res.error(req, error);
                    });
            },
            serialize(req, res) {
                Serializer.all()
                    .then((result) => {
                        try {
                            res.header('Content-Type', 'text/x-yaml');
                            res.print('cms/core/yaml', {
                                yaml: JSON2YAML.stringify(result)

                            });
                        } catch (e) {
                            console.error(e);
                            res.error(e);
                        }
                    }, res.error);
            }
        };
    });
