/* eslint no-cond-assign:0, no-new:0 */
/* jslint browser:true, node:true, esnext:true */
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
    Picker = require('cms/client/js/manager/picker.ui.js'),
    lackey = require('core/client/js'),
    template = require('core/client/js/template'),
    dateformat = require('dateformat');

/**
 * @class
 */
class MetaPickerUI extends Picker {

    get template() {

        return 'cms/cms/meta-picker';
    }


    get uri() {

    }

    selected() {

    }

    /**
     * Gets template meta data
     * @param   {string} templatePath
     * @param   {number} index
     * @returns {Promise<object>}
     */
    static readTemplate(templatePath, index) {

        if (typeof templatePath === 'object') {
            return Promise.resolve(templatePath);
        }

        cache[templatePath] = cache[templatePath] || api
            .read('/cms/template?path=' + encodeURI(templatePath) + '&limit=1')
            .then(data => {
                let ctx = {};
                if (data && data.data && data.data.length) {
                    ctx = data.data[0];
                }
                return ctx;

            });

        return cache[templatePath]
            .then(ctx => {
                let result = JSON.parse(JSON.stringify(ctx));
                result.$idx = index;
                return result;
            });
    }

    defaultSettings(context) {
        if (!context.props) {
            context.props = {};
        }
        return Promise.resolve(context.props);
    }

    defaultDictionary(context) {
        if (typeof context.template === 'string') {
            return StructureUI
                .readTemplate(context.template)
                .then(template => template.props);
        }
        return context.template.props;
    }

    mapDictionary(data) {
        data.dictionary = Object
            .keys(data.dictionary)
            .map(key => {
                let value = data.dictionary[key];
                if (Array.isArray(value)) {
                    return {
                        type: 'select',
                        name: key,
                        label: key,
                        items: value.map((item) => {
                            if (typeof item === 'string') {
                                return {
                                    label: item,
                                    value: item
                                };
                            }
                            item.label = item.label || item.value;
                            return item;
                        })
                    };
                }
                if (typeof value === 'object') {
                    if (value.default) {
                        let current = data.values[key];
                        if (current === null || current === undefined || (current.replace && current.replace(/^\s+|\s+$/g, '') === '')) {
                            data.values[key] = value.default;
                        }
                    }
                    return value;
                }
                return {
                    label: key,
                    name: key,
                    type: value
                };
            });
        return data;
    }

    buildUI() {

        let self = this;

        return Promise
            .all([
                self.defaultSettings(self.options.context),
                self.defaultDictionary(self.options.context),
                self.options.context
            ])
            .then(responses => {
                let data = {
                    values: responses[0],
                    dictionary: responses[1]
                };

                let context = self.options;


                let settings = responses[0];

                if (responses[2].createdAt) {
                    try {
                        data.createdAt = responses[2].createdAt;
                        data.createdAtFormatted = dateformat(new Date(responses[2].createdAt));
                    } catch (e) {
                        console.error(e);
                    }
                    try {
                        data.publishAt = responses[2].publishAt;
                        data.publishAtFormatted = dateformat(new Date(responses[2].publishAt));
                    } catch (e) {
                        console.error(e);
                    }
                    try {
                        data.author = responses[2].author ? responses[2].author.id : 0;
                        data.authorFormatted = responses[2].author ? responses[2].author.name : 'Not set';
                    } catch (e) {
                        console.error(e);
                    }
                }


                return template
                    .render(self.template, self.mapDictionary(data))
                    .then(nodes => {

                        self.node = nodes[0];

                        lackey
                            .bind('[data-lky-hook="action:pick-article"]', 'click', self.pickArticle.bind(self), self.node);

                        lackey
                            .bind('[data-lky-hook="action:pick-date-time"]', 'click', self.pickDateTime.bind(self, false), self.node);

                        lackey
                            .bind('[data-lky-hook="action:pick-created-at"]', 'click', self.pickDateTime.bind(self, true), self.node);

                        lackey
                            .bind('[data-lky-hook="action:pick-media"]', 'click', self.pickMedia.bind(self), self.node);

                        lackey
                            .bind('[data-lky-hook="action:pick-user"]', 'click', self.pickUser.bind(self), self.node);

                        lackey
                            .select(['input', 'select'], self.node)
                            .forEach(input => {
                                input.addEventListener('change', () => {
                                    settings[input.name] = input.value;
                                    self.changed();
                                }, true);
                            });

                        lackey.bind('[data-lky-hook="settings.back"]', 'click', () => {
                            self.resolve(null);
                        }, self.node);
                        return self.node;
                    });

            });

    }

    changed() {
        this.options.stack.manager.repository.notify();
        this.options.stack.manager.preview();
    }

    pickSomething(hook, method, changeContext) {
        let self = this,
            value = hook.getAttribute('data-value');

        return this.options.stack[method](value)
            .then(rt => {
                if (rt !== null) {
                    if(changeContext) {
                        self.options.context[hook.getAttribute('data-name')] = rt;
                    } else {
                        self.options.context.props[hook.getAttribute('data-name')] = rt;
                    }
                    self.changed();
                    self.redraw();
                }
            });
    }

    pickArticle(event, hook) {
        return this.pickSomething(hook, 'pickArticle');
    }

    pickDateTime(changeContext, event, hook) {
        return this.pickSomething(hook, 'pickDateTime', changeContext);
    }

    pickUser(event, hook) {
        return this.pickSomething(hook, 'pickUser', true);
    }

    pickMedia(event, hook) {
        return this.pickSomething(hook, 'inspectMedia');
    }
}

module.exports = MetaPickerUI;
