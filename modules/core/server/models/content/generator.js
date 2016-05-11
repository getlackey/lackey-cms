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

const SCli = require(LACKEY_PATH).cli,
    Generator = require(LACKEY_PATH).generator,
    serializer = require('./serializer'),
    coreModule = require(LACKEY_PATH).utils.cmsMod('core');


let Content, templateGenerator, taxonomyGenerator, userGenerator;

module.exports = (data) => {
    return require('./index')
        .then((content) => {
            Content = content;
            templateGenerator = require('../template/generator');
            taxonomyGenerator = require('../taxonomy/generator');
            return coreModule.model('user');
        })
        .then((user) => {
            userGenerator = user.generator;

            if (typeof data === 'string') {
                return Promise.resolve(Content.getByRoute(data));
            }

            function next() {
                SCli.debug('lackey/modules/cms/server/models/content/generator', 'Ensure that Content ' + data.type + ' ' + data.route + ' exists');

                return serializer
                    .deserialize(data)
                    .then((input) => {

                        return Content
                            .getByTypeAndRoute(input.type, input.route)
                            .then((content) => {
                                if (!content) {
                                    return Content.create(input);
                                }
                                SCli.debug('lackey/modules/cms/server/models/content/generator', 'Found content', content.type, content.route);
                                if (Generator.override('Content') && content.diff(input)) {
                                    return content.save();
                                }
                                return content;
                            })
                            .then((result) => {
                                SCli.debug('lackey/modules/cms/server/models/content/generator', 'Ensured that Content ' + data.route + ' exists');
                                return result;
                            });
                    });
            }

            function fetchAuthor() {
                if (!data.author) {
                    return next();
                }
                return userGenerator(data.author)
                    .then((author) => {
                        data.author = author.id;
                        return next();
                    });
            }

            function fetchTaxonomy() {
                return taxonomyGenerator
                    .parse(data)
                    .then((taxonomies) => {
                        if (taxonomies && taxonomies.length) {
                            data.taxonomies = taxonomies;
                        }

                        return fetchAuthor();
                    });
            }

            if (data.template) {
                SCli.debug('lackey/modules/cms/server/models/content/generator', 'Looking for template ', data.template);
                return templateGenerator(data.template).then((template) => {
                    SCli.debug('lackey/modules/cms/server/models/content/generator', 'Found template ', template.id);
                    data.template = template.id;
                    return fetchTaxonomy();
                });
            }
            return fetchTaxonomy();
        });
};
Generator.registerMapper('Content', module.exports);
