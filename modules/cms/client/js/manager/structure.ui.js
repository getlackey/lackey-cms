/* eslint no-cond-assign:0, no-new:0, no-unused-vars:0 */
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
    Emitter = require('cms/client/js/emitter').Emitter,
    lackey = require('core/client/js'),
    Template = require('core/client/js/template'),
    api = require('core/client/js/api'),
    formatters = require('jsondiffpatch/src/formatters'),
    dateformat = require('dateformat'),
    treeParser = require('cms/shared/treeparser'),
    dragula = require('dragula');

let
    cache = {};

/**
 * @class
 * @name lackey-cms/modules/cms/client/js/manager/StructureUI
 */
class StructureUI extends Emitter {

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

        this._onRepositoryChanged = this.onRepositoryChanged.bind(this);
        this.repository = repository;
        this.repository.on('changed', this._onRepositoryChanged);

    }

    get metaNode() {
        return lackey.select('[data-lky-template="cms/cms/properties"]', this.node)[0];
    }

    get taxonomyNode() {
        return lackey.select('[data-lky-template="cms/cms/structure/taxonomies"]', this.node)[0];
    }

    defaultExpose(context) {
        return StructureUI
            .readTemplate(context.template)
            .then(template => template.expose || []);

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

    /**
     * Builds UI
     * @returns {Promise<HTMLElement>}
     */
    buildUI() {

        let
            self = this,
            ignore = lackey.select('[data-lky-hook="header.settings"]')[0].getAttribute('data-lky-ignore').split(',');

        return Template
            .render('cms/cms/settings', this.options || {})
            .then(nodes => {
                self.node = nodes[0];

                if (self.options.open) {
                    self.node.setAttribute('data-lky-edit', self.options.open);
                } else {
                    self.node.removeAttribute('data-lky-edit');
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
                        '[data-lky-hook="settings.open.diff"]',
                        '[data-lky-hook="settings.open.cms"]'
                    ], self.node)
                    .forEach(element => {
                        var elementAnchor = element.querySelector('a');

                        if (ignore.indexOf(element.getAttribute('data-lky-open')) !== -1) {
                            element.parentNode.removeChild(element);
                        } else if (elementAnchor && elementAnchor.getAttribute('href') !== '#') {
                            element.addEventListener('click', self.openLink.bind(self), true);
                        } else {
                            element.addEventListener('click', self.toggle.bind(self), true);
                        }
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
        let
            context,
            self = this;

        return this
            .options
            .context()
            .then(ctx => {
                context = ctx;
                return self.options.expose(ctx);
            })
            .then(expose => {
                return Template
                    .redraw('sections', {
                        context: context,
                        expose: expose
                    }, self.node);
            })
            .then(root => {
                if (self.options.layoutProvider) {
                    self.layout = self.options.layoutProvider(self.layoutChanged.bind(self));

                    self.drawLayout(self.layout);
                }

                lackey.bind('[data-lky-cog]', 'click', self.inspectEvent.bind(self), root[0]);
                lackey.bind('[data-lky-bin]', 'click', self.removeBlock.bind(self), root[0]);
                lackey.bind('[data-lky-add-block]', 'click', self.addBlock.bind(self), root[0]);

                let drake = dragula([root[0].querySelector('section.block-list')], {
                    moves: (element, container, handle) => handle.hasAttribute('data-lky-icon'),
                    accepts: (element, target, source, sibling) => !sibling || sibling.tagName !== 'BUTTON'
                });

                drake.on('drop', (element, target, source, before) => {
                    self.moveBlock(element, before);
                });
            });
    }

    addBlock(event, hook) {

        this.collapse();

        let
            idx = hook.getAttribute('data-lky-add-block'),
            self = this,
            path = hook.getAttribute('data-lky-path'),
            context;

        return this
            .options
            .context()
            .then(ctx => {
                context = ctx;
                return this.options.stack.pickBlock();
            })
            .then(rt => {
                if (rt !== null) {
                    treeParser.insertAfter(context, path + '.' + idx, {
                        type: 'Block',
                        template: rt,
                        layout: {},
                        props: {}
                    });
                    self.emit('changed');
                    return self.drawSections();
                }

            });
    }

    removeBlock(event, hook) {

        let
            path = hook.getAttribute('data-lky-path'),
            self = this;

        return this
            .options
            .context()
            .then(context => {
                treeParser.remove(context, path);
                self.emit('changed');
                return self.drawSections();
            });
    }

    moveBlock(blockElement, beforeBlockElement) {
        let self = this,
            parentPath = blockElement.getAttribute('data-lky-parent'),
            blockIndex = parseInt(blockElement.getAttribute('data-lky-index')),
            blockPath = parentPath + '.' + blockIndex,
            beforeBlockIndex,
            beforeBlockPath;

        if (beforeBlockElement) {
            beforeBlockIndex = parseInt(beforeBlockElement.getAttribute('data-lky-index'));
            beforeBlockPath = parentPath + '.' + beforeBlockIndex;

            // We're gonna remove the block first, adjust the index for afterwards.
            if (beforeBlockIndex > blockIndex) {
                beforeBlockIndex -= 1;
            }
        }

        return this
            .options
            .context()
            .then(context => {
                let insertIndex,
                    block = treeParser.get(context, blockPath);

                if (beforeBlockPath) {
                    insertIndex = beforeBlockIndex - 1;
                } else {
                    insertIndex = treeParser.get(context, parentPath).length;
                }

                treeParser.remove(context, blockPath);
                treeParser.insertAfter(context, parentPath + '.' + insertIndex, block);

                self.emit('changed');
                return self.drawSections();
            });
    }

    drawDimensions() {

        let
            self = this,
            context,
            locales,
            viewAs,
            ignore = lackey.select('[data-lky-hook="header.settings"]')[0].getAttribute('data-lky-dimensionignore').split(',');

        return api
            .read('/cms/language?enabled=true')
            .then(locs => {
                locales = locs.data;
                return api.read('/view-as');
            })
            .then(response => {
                viewAs = response;
                return self.options.context();
            })
            .then(ctx => {
                context = ctx;

                return Template
                    .redraw('dimensions', {
                        context: ctx,
                        locale: self.options.manager.locale,
                        variant: self.options.manager.variant,
                        locales: locales,
                        viewAs: viewAs
                    }, self.node);
            })
            .then(root => {
                lackey
                    .bind('[data-lky-variant]', 'change', self.viewInVariant.bind(self), root[0]);
                lackey
                    .bind('[data-lky-locale]', 'change', self.viewInLocale.bind(self), root[0]);
                lackey
                    .bind('[data-lky-view-as]', 'change', self.viewAs.bind(self), root[0]);

                lackey
                    .select([
                        '[data-lky-dimension="viewRole"]',
                        '[data-lky-dimension="viewVariant"]',
                        '[data-lky-dimension="viewLanguage"]',
                        '[data-lky-dimension="usedDimensions"]'
                    ], self.node)
                    .forEach(element => {

                        if (ignore.indexOf(element.getAttribute('data-lky-dimension')) !== -1) {
                            element.parentNode.removeChild(element);
                        }
                    });

            });
    }

    viewAs(event, hook) {

        top.Lackey.setCookie('lky-view-as', hook.value);
        this.options.manager.preview();
        this.options.manager.stack.clear();
        return;
    }

    viewInVariant(event, hook) {

        this.options.manager.preview(hook.value);
        this.options.manager.stack.clear();
        return;
    }

    viewInLocale(event, hook) {

        this.options.manager.preview(undefined, hook.value);
        this.options.manager.stack.clear();
        return;
    }

    inspect(path, templatePath) {
        let
            structureController,
            context,
            data,
            self = this;

        this.collapse();

        return this
            .options
            .context()
            .then(ctx => {

                context = ctx;
                return StructureUI
                    .readTemplate(templatePath);
            })
            .then(template => {

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
                    manager: self.options.manager,
                    expose: () => {

                        return Promise.resolve(template.expose || []);

                    },
                    layoutProvider: self.options.layoutProvider,
                    layoutPath: path,
                    layoutTemplatePath: templatePath,
                    settingsDictionary: () => {

                        return Promise.resolve(template.props);
                    },
                    open: 'meta'
                }, this.repository);

                structureController.on('changed', (function () {
                    this.emit('changed');
                }).bind(self));
                return this.options.stack.inspectStructure(structureController);
            });

    }
    inspectEvent(event, hook) {
        return this.inspect(
            hook.getAttribute('data-lky-path'),
            hook.getAttribute('data-lky-template')
        );
    }

    onRepositoryChanged() {
        lackey
            .select('[data-lky-hook="settings.diff"] div', this.node)[0]
            .innerHTML = this.repository.visualDiff();
    }

    layoutChanged() {
        var self = this;

        self.drawLayout(self.layout);
    }

    drawLayout(layout) {
        var self = this,
            sectionsRoot = lackey.hook('settings.blocks', self.node),
            layoutContainer = lackey.hook('layout', sectionsRoot),
            decoupledLayoutHTML,
            decoupledLayout,
            maxY,
            yPad = 0;

        decoupledLayoutHTML = layout.get(self.options.layoutPath, self.options.layoutTemplatePath).outerHTML;

        layoutContainer.innerHTML = decoupledLayoutHTML;
        decoupledLayout = layoutContainer.children[0];

        maxY = parseFloat(decoupledLayout.style.height);
        if (isNaN(maxY)) {
            maxY = -Infinity;
        }

        for (let i = 0; i < decoupledLayout.children.length; i += 1) {
            let block = decoupledLayout.children[i],
                blockBottom = parseFloat(block.style.top) + parseFloat(block.style.height);

            if (blockBottom > maxY) {
                maxY = blockBottom;
                yPad = 0.1;
            }
        }

        decoupledLayout.style.height = (maxY + yPad) + 'em';

        self.bindLayout();
    }
    bindLayout() {
        var self = this,
            sectionsRoot = lackey.hook('settings.blocks', self.node),
            blocksContainer = lackey.hook('sections', sectionsRoot),
            layoutContainer = lackey.hook('layout', sectionsRoot);

        function getOffsetTopForFrom(element, container) {
            var target = container.offsetParent,
                offset = element.offsetTop;

            element = element.offsetParent;

            while (element !== null && element !== target) {
                offset += element.offsetTop;

                element = element.offsetParent;
            }

            return offset;
        }

        lackey.bind('figure.block', 'click', (ev, block) => {
            let path = block.getAttribute('data-lky-local-path'),
                blocksMiddle = blocksContainer.offsetHeight / 2,
                layoutMiddle = layoutContainer.offsetHeight / 2;

            lackey.select('[data-lky-component][data-lky-path="' + path + '"]', blocksContainer)
                .forEach(el => {
                    el.setAttribute('data-lky-highlight', '');
                    setTimeout(() => el.removeAttribute('data-lky-highlight'), 800);

                    blocksContainer.scrollTop =
                        getOffsetTopForFrom(el, blocksContainer) +
                        (el.offsetHeight / 2) - blocksMiddle;
                });

            block.setAttribute('data-lky-highlight', '');
            setTimeout(() => block.removeAttribute('data-lky-highlight'), 800);

            layoutContainer.scrollTop =
                getOffsetTopForFrom(block, layoutContainer) +
                (block.offsetHeight / 2) - layoutMiddle;

        }, layoutContainer);
    }

    drawTaxonomy() {

        let
            self = this,
            context;

        return this.options
            .context()
            .then(ctx => {
                context = ctx;
                return ctx;
            })
            .then(ctx => Template.redraw(self.taxonomyNode, ctx))
            .then(() => {
                if ((context.template && (context.template.allowTaxonomies && context.template.allowTaxonomies.length < 1)) || !context.template) {
                   lackey.select('[data-lky-hook="settings.open.taxonomy"]', self.node).forEach(element => {
                       element.parentNode.removeChild(element);
                   });
                }

                lackey
                    .bind('[data-lky-hook="action:pick-taxonomy"]', 'click', self.pickTaxonomy.bind(self, context), self.node);
                lackey
                    .bind('[data-lky-hook="taxonomy-remove"]', 'click', self.deleteTaxonomy.bind(self, context), self.node);
            });
    }

    drawMeta() {
        let self = this;

        return this.options
            .context()
            .then(context => Promise.all([
                self.options.settings(context),
                self.options.settingsDictionary(context),
                context
            ]))
            .then(responses => {
                let data = {
                    values: responses[0],
                    dictionary: responses[1]
                };
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
                return Template
                    .redraw(self.metaNode, self.mapDictionary(data))
                    .then(() => {
                        return responses;
                    });
            })
            .then(this.bindMetaEvents.bind(this));

    }

    bindMetaEvents(responses) {
        let settings = responses[0],
            context = responses[2];
        let self = this;
        lackey
            .bind('[data-lky-hook="action:pick-article"]', 'click', this.pickArticle.bind(this, settings), this.node);

        lackey
            .bind('[data-lky-hook="action:pick-date-time"]', 'click', this.pickDateTime.bind(this, settings), this.node);

        lackey
            .bind('[data-lky-hook="action:pick-created-at"]', 'click', this.pickDateTime.bind(this, context), this.node);

        lackey
            .bind('[data-lky-hook="action:pick-media"]', 'click', this.pickMedia.bind(this, settings), this.node);

        lackey
            .bind('[data-lky-hook="action:pick-user"]', 'click', this.pickUser.bind(this, context), this.node);

        lackey
            .select(['input', 'select'], self.metaNode)
            .forEach(input => {
                input.addEventListener('change', () => {
                    settings[input.name] = input.value;
                    self.emit('changed', settings);
                }, true);
            });

        lackey
            .select(['input[type=url]'], self.metaNode)
            .forEach(input => {

                var urlPreview = input.nextElementSibling.querySelector('a');

                if (!urlPreview) { return; }

                urlPreview.href = input.value;
                urlPreview.textContent = urlPreview.href;

                input.addEventListener('keyup', () => {
                    urlPreview.href = input.value;
                    urlPreview.textContent = urlPreview.href;
                }, true);
            });
    }

    pickArticle(settings, event, hook) {
        this.collapse();
        let self = this,
            route = hook.getAttribute('data-value'),
            taxonomies = hook.getAttribute('data-taxonomy');

        return this.options.stack
            .pickArticle(route, taxonomies)
            .then(rt => {
                if (rt !== null) {
                    settings[hook.getAttribute('data-name')] = rt;
                    self.emit('changed', settings);
                    self.drawMeta();
                }
                self.node.setAttribute('data-lky-edit', 'meta');
            });
    }

    pickDateTime(settings, event, hook) {
        this.collapse();
        let self = this,
            date = hook.getAttribute('data-value');

        return this.options.stack
            .pickDateTime(date)
            .then(rt => {
                if (rt !== null) {
                    settings[hook.getAttribute('data-name')] = rt;
                    self.emit('changed', settings);
                    self.drawMeta();
                }
                self.node.setAttribute('data-lky-edit', 'meta');
            });
    }

    pickUser(settings, event, hook) {
        this.collapse();
        let self = this,
            user = hook.getAttribute('data-value');

        return this.options.stack
            .pickUser(user)
            .then(rt => {
                if (rt !== null) {
                    settings[hook.getAttribute('data-name')] = rt;
                    self.emit('changed', settings);
                    self.drawMeta();
                }
                self.node.setAttribute('data-lky-edit', 'meta');
            });
    }

    pickTaxonomy(settings, event, hook) {

        this.collapse();
        let self = this,
            type = hook.getAttribute('data-type'),
            addable = hook.getAttribute('data-addable');

        return this.options.stack
            .pickTaxonomy(type, addable)
            .then(rt => {
                if (rt !== null) {
                    self.options
                        .context()
                        .then(ctx => {
                            ctx.taxonomies = (ctx.taxonomies || []);
                            ctx.taxonomies.push(JSON.parse(rt));
                            self.emit('changed');
                            return self.drawTaxonomy();
                        });

                }
                self.node.setAttribute('data-lky-edit', 'taxonomy');
            });
    }

    deleteTaxonomy(settings, event, hook) {

        let self = this,
            type = hook.getAttribute('data-type'),
            name = hook.getAttribute('data-name');

        return this.options
            .context()
            .then(ctx => {
                (ctx.taxonomies || []).forEach((taxonomy, index) => {
                    if (taxonomy.name === name && taxonomy.type.name === type) {
                        ctx.taxonomies.splice(index, 1);
                    }
                });
                self.emit('changed');
                return self.drawTaxonomy();
            });
    }

    pickMedia(settings, event, hook) {
        this.collapse();
        let self = this,
            route = hook.getAttribute('data-value');
        return this.options.stack
            .inspectMedia(route)
            .then(rt => {
                if (rt !== null) {
                    settings[hook.getAttribute('data-name')] = rt.source || '';
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

    openLink(event) {
        event.preventDefault();
        event.stopPropagation();

        let anchor = event.target.querySelector('a');

        document.location = anchor.getAttribute('href');
    }

    collapse() {
        this.node.removeAttribute('data-lky-edit');
    }

    /**
     * Makes fade in animation
     * @returns {Promise}
     */
    fadeIn() {
        return new Promise(resolve => {
            let self = this;

            setTimeout(() => {
                self.node.setAttribute('data-lky-open', '');

                resolve();
            }, 10);
        });
    }

    /**
     * Makes fade out animation
     * @returns {Promise}
     */
    remove() {
        return new Promise(resolve => {
            let self = this,
                handler = () => {
                    self.node.removeEventListener('transitionend', handler, false);
                    self.node.parentNode.removeChild(self.node);

                    resolve();
                };

            self.node.addEventListener('transitionend', handler, false);
            self.node.removeAttribute('data-lky-open', '');

            self.repository.off('changed', self._onRepositoryChanged);
            self.repository = null;

            if (self.layout) {
                self.layout.destroy();
            }
        });
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
                } else if (Array.isArray(value.items)) {
                    return {
                        type: 'select',
                        name: key,
                        label: value.label || key,
                        items: value.items.map((item) => {
                            if (typeof item === 'string') {
                                return {
                                    label: item,
                                    value: item
                                };
                            }
                            item.label = item.label || item.value;
                            return item;
                        }),
                        tooltip: value.tooltip || false
                    };
                }
                if (typeof value === 'object') {
                    if (value.default) {
                        let current = data.values[key];
                        if (current === null || current === undefined || (current.replace && current.replace(/^\s+|\s+$/g, '') === '')) {
                            data.values[key] = value.default;
                        }
                    }
                    value.name = value.name || key;
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

    return chunk
        .map(injectedChunk => {
            StructureUI
                .readTemplate(templatePath, index)
                .then(data => {
                    injectedChunk
                        .render(bodies.block, context.push(data))
                        .end();
                });
        });


};

module.exports = StructureUI;
