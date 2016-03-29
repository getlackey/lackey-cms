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

if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../lib';
}

const SUtils = require(LACKEY_PATH).utils,
    humanize = require('humanize');

module.exports = SUtils
    .deps(
        SUtils.cmsMod('core').model('activity-log'),
        SUtils.cmsMod('users').model('role'),
        SUtils.cmsMod('i18n').model('language'),
        require('../models/template')
    )
    .promised((Activity, Role, Language, Template) => {

        return {
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

                Template.getOfType('variant')
                    .then((_variants) => {
                        variants = _variants;
                        return Language.getEnabled();
                    })
                    .then((languages) => {
                        res.edit(req.user && req.user.getACL('edit').length > 0);
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
            }
        };
    });
