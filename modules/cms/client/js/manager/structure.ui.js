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
const Emitter = require('cms/client/js/emitter').Emitter,
    lackey = require('core/client/js'),
    Template = require('core/client/js/template'),
    api = require('core/client/js/api'),
    formatters = require('jsondiffpatch/src/formatters'),
    Autocomplete = require('cms/client/js/controls/autocomplete'),
    treeParser = require('cms/shared/treeparser');

let cache = {};

/**
 * @class
 */
class StructureUI extends Emitter {

    static readTemplate(templatePath, index) {
        if (typeof templatePath === 'object') {
            return Promise.resolve(templatePath);
        }
        cache[templatePath] = cache[templatePath] || api
            .read('/cms/template?path=' + encodeURI(templatePath) + '&limit=1')
            .then((data) => {
                let ctx = {};
                if (data && data.data && data.data.length) {
                    ctx = data.data[0];
                }
                return ctx;

            });

        return cache[templatePath]
            .then((ctx) => {
                ctx.$idx = index;
                return ctx;
            });
    }


    /**
     * @constructs lackey-cms/modules/cms/client/manager/StructureUI
     * @param {HTMLElement} rootNode
     * @param {object}   vars
     * @param {object} vars.settings
     * @param {object} vars.context
     * @param {object} vars.content
     * @param {object} vars.expose
     * @param {object} vars.settingsDictionary
     * @param {function} vars.pullLatest
     */
    constructor(options, repository) {
        super();
        this.options = options;
        this.options.settings = options.settings || this.defaultSettings;
        this.options.settingsDictionary = options.settingsDictionary || this.defaultDictionary;
        this.options.expose = options.expose || this.defaultExpose;

        this._onRepositoryChanged = lackey.as(this.onRepositoryChanged, this);
        this.repository = repository;
        this.repository.on('changed', this._onRepositoryChanged);

    }

    get metaNode() {
        return lackey.select('[data-lky-template="cms/cms/properties"]', this.node)[0];
    }

    defaultExpose(context) {
        return StructureUI
            .readTemplate(context.template)
            .then((template) => template.expose || []);

    }

    defaultSettings(context) {
        return Promise.resolve(context.props);
    }

    defaultDictionary(context) {
        if (typeof context.template === 'string') {
            return StructureUI
                .readTemplate(context.template)
                .then((template) => template.props);
        }
        return context.template.props;
    }

    /**
     * Builds UI
     * @returns {Promise<HTMLElement}
     */
    buildUI() {
        let self = this;
        return Template
            .render('cms/cms/settings', this.options || {})
            .then((nodes) => {
                self.node = nodes[0];

                if (self.options.open) {
                    self.node.setAttribute('data-lky-edit', self.options.open);
                }

                lackey.bind('[data-lky-hook="settings.back"]', 'click', () => {
                    self.options.stack.pop();
                }, self.node);

                lackey
                    .select([
                        '[data-lky-hook="settings.open.meta"]',
                        '[data-lky-hook="settings.open.dimensions"]',
                        '[data-lky-hook="settings.open.taxonomy"]',
                        '[data-lky-hook="settings.open.blocks"]',
                        '[data-lky-hook="settings.open.diff"]'
                    ], self.node)
                    .forEach((element) => {
                        element.addEventListener('click', lackey.as(self.toggle, self), true);
                    });
                return self.drawMeta();
            })
            .then(() => {
                return self.drawTaxonomy();
            })
            .then(() => {
                return self.drawSections();
            })
            .then(() => {
                return self.drawDimensions();
            })
            .then(() => {
                self.onRepositoryChanged();

                let diffToggle = lackey
                    .select('[data-lky-hook="settings.diff"] input', self.node)[0];

                if (document.body.className.toString().match(/jsondiffpatch-unchanged-hidden/)) {
                    diffToggle.setAttribute('checked', true);
                } else {
                    diffToggle.removeAttribute('checked');
                }
                diffToggle.addEventListener('change', () => {
                    if (diffToggle.checked) {
                        formatters.html.hideUnchanged();
                    } else {
                        formatters.html.showUnchanged();
                    }
                });
                return self.node;
            });
    }

    drawSections() {
        let context,
            self = this;

        return this
            .options
            .context()
            .then((ctx) => {
                context = ctx;
                return self.options.expose(ctx);
            })
            .then((expose) => {
                return Template
                    .redraw('sections', {
                        context: context,
                        expose: expose
                    }, self.node);
            })
            .then((root) => {
                lackey.bind('[data-lky-cog]', 'click', lackey.as(self.inspect, self), root[0]);
            });
    }

    drawDimensions() {
        let self = this,
            locales,
            viewAs;

        return api
            .read('/cms/language?enabled=true')
            .then((locs) => {
                locales = locs.data;
                return api.read('/view-as');
            })
            .then((response) => {
                viewAs = response;
                return self.options.context();
            })
            .then((context) => {
                return Template
                    .redraw('dimensions', {
                        context: context,
                        locale: top.Lackey.manager.locale,
                        variant: top.Lackey.manager.variant,
                        locales: locales,
                        viewAs: viewAs
                    }, self.node);
            })
            .then((root) => {
                lackey
                    .bind('[data-lky-variant]', 'change', lackey.as(self.viewInVariant, self), root[0]);
                lackey
                    .bind('[data-lky-locale]', 'change', lackey.as(self.viewInLocale, self), root[0]);
                lackey
                    .bind('[data-lky-view-as]', 'change', lackey.as(self.viewAs, self), root[0]);
            });
    }

    viewAs(event, hook) {
        top.Lackey.setCookie('lky-view-as', hook.value);
        top.Lackey.manager.preview();
        top.Lackey.manager.stack.clear();
        return;
    }

    viewInVariant(event, hook) {
        top.Lackey.manager.preview(hook.value);
        top.Lackey.manager.stack.clear();
        return;
    }

    viewInLocale(event, hook) {
        top.Lackey.manager.preview(undefined, hook.value);
        top.Lackey.manager.stack.clear();
        return;
    }

    inspect(event, hook) {

        let path = hook.getAttribute('data-lky-path'),
            templatePath = hook.getAttribute('data-lky-template'),
            structureController,
            context,
            data,
            self = this;

        this.collapse();

        return this
            .options
            .context()
            .then((ctx) => {
                context = ctx;
                return StructureUI
                    .readTemplate(templatePath);
            })
            .then((template) => {

                data = treeParser.get(context, path);
                if (!data) {
                    data = {};
                    treeParser.set(context, path, data);
                }

                structureController = new StructureUI({
                    type: 'content',
                    id: this.options.id,
                    context: () => Promise.resolve(data),
                    stack: self.options.stack,
                    expose: () => {
                        return Promise.resolve(template.expose || []);

                    },
                    settingsDictionary: () => {
                        return Promise.resolve(template.props);
                    },
                    open: 'meta'
                }, this.repository);

                structureController.on('changed', lackey.as(() => {
                    this.emit('changed');
                }, self));
                return this.options.stack.inspectStructure(structureController);
            });

    }

    onRepositoryChanged() {
        lackey
            .select('[data-lky-hook="settings.diff"] div', this.node)[0]
            .innerHTML = this.repository.visualDiff();
    }

    drawTaxonomy() {
        let self = this;
        return this.options
            .context()
            .then((context) => {

                let
                    tagsNode = lackey.hook('tags', this.node),
                    restrictionNode = lackey.hook('restricitons', this.node),
                    taxes = context.taxonomies || [],
                    tags = taxes.filter((tax) => !tax.type || !tax.type.restrictive),
                    restrictive = taxes.filter((tax) => tax.type && tax.type.restrictive),
                    options = {
                        createNew: false,
                        separators: [
                            13,
                            20
                        ],
                        formatLabel: (item) => {
                            return (item.type ? item.type.label + ': ' : '') + item.label;
                        },
                        equals: (item, term) => {
                            return item.label === term;
                        }

                    },
                    tagsControl = new Autocomplete(tagsNode, lackey.merge(options, {
                        query: (text) => {
                            return api
                                .read('/cms/taxonomy?restrictive=0&name=' + encodeURI(text + '%'))
                                .then((data) => data.data);
                        },
                        value: tags
                    })),
                    restrictiveControl = new Autocomplete(restrictionNode, lackey.merge(options, {
                        query: (text) => {
                            return api
                                .read('/cms/taxonomy?restrictive=1&name=' + encodeURI(text + '%'))
                                .then((data) => data.data);
                        },
                        value: restrictive
                    })),
                    handler = () => {

                        return self.options
                            .context()
                            .then((ctx) => {
                                ctx.taxonomies = [].concat(tagsControl.value, restrictiveControl.value);
                                self.emit('changed');
                            });
                    };
                tagsControl.on('changed', handler);
                restrictiveControl.on('changed', handler);
            });
    }

    drawMeta() {
        let self = this;

        return this.options
            .context()
            .then((context) => Promise.all([
                self.options.settings(context),
                self.options.settingsDictionary(context)
            ]))
            .then((responses) => {
                return Template
                    .redraw(self.metaNode, self.mapDictionary({
                        values: responses[0],
                        dictionary: responses[1]
                    }))
                    .then(() => responses[0]);
            })
            .then(lackey.as(this.bindMetaEvents, this));

    }

    bindMetaEvents(settings) {
        let self = this;
        lackey
            .bind('[data-lky-hook="action:pick-article"]', 'click', lackey.as(this.pickArticle, this, [settings]), this.node);

        lackey
            .select(['input', 'select'], self.metaNode)
            .forEach((input) => {
                input.addEventListener('change', () => {
                    settings[input.name] = input.value;
                    self.emit('changed', settings);
                }, true);
            });

    }

    pickArticle(settings, event, hook) {
        this.collapse();
        let self = this,
            route = hook.getAttribute('data-value');

        return this.options.stack
            .pickArticle(route)
            .then((rt) => {
                if (rt !== null) {
                    settings[hook.getAttribute('data-name')] = rt;
                    self.emit('changed', settings);
                    self.drawMeta();
                }
                self.node.setAttribute('data-lky-edit', 'meta');
            });
    }


    toggle(event) {

        event.preventDefault();
        event.stopPropagation();

        let toOpen = event.target.getAttribute('data-lky-open'),
            current = this.node.getAttribute('data-lky-edit');

        if (current === toOpen) {
            this.node.removeAttribute('data-lky-edit');
        } else {
            this.node.setAttribute('data-lky-edit', toOpen);
        }
    }

    collapse() {
        this.node.removeAttribute('data-lky-edit');
    }

    /**
     * Makes fade in animation
     * @returns {Promise}
     */
    fadeIn() {
        return new Promise((resolve) => {
            let self = this,
                handler = () => {
                    self.node.removeEventListener('transitionend', handler, false);
                    resolve();
                };
            setTimeout(() => {
                self.node.addEventListener('transitionend', handler, false);
                self.node.setAttribute('data-lky-open', '');
            }, 0);
        });
    }

    /**
     * Makes fade out animation
     * @returns {Promise}
     */
    remove() {
        this.repository.off('changed', this._onRepositoryChanged);
        this.repository = null;
        return new Promise((resolve) => {

            let self = this,
                handler = () => {
                    self.node.removeEventListener('transitionend', handler, false);
                    self.node.parentNode.removeChild(self.node);
                    resolve();
                };
            self.node.addEventListener('transitionend', handler, false);
            self.node.removeAttribute('data-lky-open');
        });
    }

    mapDictionary(data) {
        data.dictionary = Object
            .keys(data.dictionary)
            .map((key) => {
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

}

/**
 * Dust helper to pull Template data
 * @param   {Chunk} chunk
 * @param   {Context}    context
 * @param   {Object}   bodies
 * @param   {Object}   params
 * @param   {string}    params.template
 * @returns {Chunk}
 */
Template.dust.helpers.templateData = function (chunk, context, bodies, params) {

    let templatePath = params.template,
        index = context.get('$idx');

    return chunk.map((injectedChunk) => {
        StructureUI
            .readTemplate(templatePath, index)
            .then((data) => {
                injectedChunk
                    .render(bodies.block, context.push(data))
                    .end();
            });
    });


};

module.exports = StructureUI;
