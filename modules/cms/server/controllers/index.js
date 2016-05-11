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
    humanize = require('humanize');

module.exports = SUtils
    .waitForAs('lackey-cms/modules/cms/server/controllers',
        SUtils.cmsMod('core').model('activity-log'),
        SUtils.cmsMod('core').model('role'),
        SUtils.cmsMod('i18n').model('language'),
        SUtils.cmsMod('core').model('template'),
        require('../lib/serializer'),
        require('json2yaml')
    )
    .then((Activity, Role, Language, Template, Serializer, JSON2YAML) => {

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

                let iframePath, variants;

                iframePath = req.originalUrl.replace(/^\/admin/, '');

                if (iframePath === '') {
                    iframePath = iframePath + '/';
                }

                iframePath = req.__host + iframePath;


                return Template.getOfType('variant')
                    .then((_variants) => {
                        variants = _variants;
                        return Language.getEnabled();
                    })
                    .then((languages) => {
                        res.edit(req.user && req.user.getACL('edit').length > 0);
                        res.js('js/cms/cms/header.js');
                        res.print('cms/cms/iframe', {
                            page: iframePath,
                            variants: variants.map((variant) => {
                                return {
                                    path: variant.path,
                                    name: variant.name
                                };
                            }),
                            langauges: languages
                        });

                    });

            },
            activityStream: (req, res) => {

                Activity
                    .query()
                    .then((data) => {
                        res.send({
                            template: 'cms/cms/activity-stream',
                            data: {
                                list: data
                            }
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
                            res.send({
                                template: 'cms/core/yaml',
                                data: {
                                    yaml: JSON2YAML.stringify(result)
                                }
                            });
                        } catch (e) {
                            console.error(e);
                            res.error(e);
                        }
                    }, res.error);
            }
        };
    });
