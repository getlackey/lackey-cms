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
    lackey = require('./../../../../core/client/js'),
    _ = require('lodash'),
    diff = require('jsondiffpatch'),
    diffFormatters = require('jsondiffpatch/src/main-formatters'),
    api = require('../api'),
    modal = require('./../../../../core/client/js/modal'),
    template = require('./../../../../core/client/js/template'),
    treeParser = require('./../../../shared/treeparser'),
    Structure = require('./structure'),
    MediaModalController = require('./media');

let contents = {},
    cache = {},
    visualdiff = lackey.hook('visualdiff');

function jsjp(input) {
    return JSON.parse(JSON.stringify(input));
}

let self,
    structure,
    structureNode,
    structureCopy,
    locale = null,
    defaultLocale = null,
    LackeyPageManager = {
        refresh: function () {
            var changed = null;
            try {
                changed = diff.diff(jsjp(cache), jsjp(contents));
                visualdiff.innerHTML = diffFormatters.html.format(changed, cache);
            } catch (e) {
                console.error(e);
            }
            if (self.saveBtn) {
                self.saveBtn.disabled = !changed;
            }
            if (structure) {
                self.structure(structure);
            }

        },
        init: (options) => {

            LackeyPageManager.readDefault();

            lackey.select('html').forEach((elem) => {
                locale = elem.getAttribute('lang');
                defaultLocale = elem.getAttribute('data-default-locale');
                if (locale === defaultLocale) {
                    locale = '*';
                }
            });

            if (options && options.controls) {
                if (options.controls.visibility) {
                    self.visibility = lackey.select(options.controls.visibility)[0];
                    lackey.bind(self.visibility, 'click', lackey.as(self.toggleVisibility, self));
                }
                if (options.controls.save) {
                    self.saveBtn = lackey.select(options.controls.save)[0];
                    lackey.bind(self.saveBtn, 'click', lackey.as(self.save, self));
                }
                if (options.controls.cancel) {
                    lackey.bind(options.controls.cancel, 'click', lackey.as(self.cancel, self));
                }
                if (options.controls.taxonomy) {
                    lackey.bind(options.controls.taxonomy, 'click', lackey.as(self.taxonomy, self));
                }
                if (options.controls.properties) {
                    lackey.bind(options.controls.properties, 'click', lackey.as(self.properties, self));
                }
                if (options.controls.structure) {
                    structure = options.controls.structure;
                    LackeyPageManager.structure(options.controls.structure);

                }
                if (options.controls.preview) {
                    lackey.bind(options.controls.preview, 'click', lackey.as(self.preview, self));
                }
                if (options.controls.create) {
                    lackey.bind(options.controls.create, 'click', lackey.as(self.create, self));
                }
                if (options.controls.createdAt && options.controls.createdAtTime) {
                    self.createdAt(options.controls.createdAt, options.controls.createdAtTime);
                }
            }
            LackeyPageManager.setVisibility(LackeyPageManager.getVisibility());

            lackey.on('cms/cms/image:selected', (data) => {
                let contentId = data.hook.getAttribute('data-lky-content'),
                    path = data.hook.getAttribute('data-lky-path'),
                    variant = data.hook.getAttribute('data-lky-variant');
                LackeyPageManager.set(contentId, path, variant, {
                    type: 'Media',
                    id: data.id
                });
            });
        },
        createdAt: (dateSelector, timeSelector) => {
            let dateHook = lackey.select(dateSelector)[0],
                timeHook = lackey.select(timeSelector)[0];
            self.getDefault()
                .then((def) => {
                    dateHook.value = new Date(def.createdAt).toISOString().substr(0, 10);
                    timeHook.value = new Date(def.createdAt).toISOString().substr(11, 5);
                    lackey.bind([dateHook, timeHook], 'change', () => {
                        let string = new Date(dateHook.value + 'T' + timeHook.value);
                        contents[def.id].createdAt = string.toISOString();
                        self.refresh();
                    });
                });
        },
        create: () => {
            api.get('cms/template?selectable=true')
                .then((templates) => {
                    return modal.open('cms/cms/newpage', {
                        templates: templates.data
                    }, function (rootNode, vars, resolve) {
                        lackey.bind('lky:create', 'click', () => {
                            resolve(lackey.form(rootNode));
                        }, rootNode);
                        lackey.bind('lky:cancel', 'click', () => {
                            resolve(null);
                        }, rootNode);
                    });
                }).then(() => {});
        },
        preview: () => {
            self.getDefault()
                .then((def) => {
                    let data = JSON.stringify({
                            location: ((a) => {
                                return a === '' ? '/' : a;
                            })(top.location.pathname.replace(/^\/admin/, '')),
                            contents: contents[def.id]
                        }),
                        form = top.document.createElement('form'),
                        input = top.document.createElement('input');
                    form.method = 'post';
                    form.action = '/cms/preview';
                    form.target = '_preview';
                    input.type = 'hidden';
                    input.name = 'preview';
                    input.value = data;
                    form.appendChild(input);
                    document.body.appendChild(form);
                    form.submit();
                    document.body.removeChild(form);
                });
        },
        media: (media) => {
            return modal.open('cms/cms/image', {
                node: media.node,
                media: media.media
            }, MediaModalController);
        },
        structure: (selector) => {
            if (!structureNode) {
                Structure.changed(() => {
                    self.getDefault()
                        .then((page) => {
                            contents[page.id].layout = structureCopy;
                            self.refresh();
                            self.preview();
                        });
                });

            }
            return self.getDefault().then((page) => {
                structureCopy = _.clone(contents[page.id] ? contents[page.id].layout : page.layout) || {};

                if (structureNode) {
                    structureNode.parentNode.removeChild(structureNode);
                }
                let node = new Structure(structureCopy);
                structureNode = node.node;
                lackey.select(selector)[0].appendChild(node.node);
            });
        },
        capture: (event) => {
            event.preventDefault();
            event.cancelBubble = true;
            return false;
        },
        readDefault: () => {
            let loc = top.location.pathname.replace(/^\/admin/, '');
            if (loc === '') {
                loc = '/';
            }
            self._default = api.read('/cms/content?route=' + loc).then((data) => {
                return data.data[0];
            });
            return self._default;
        },
        getDefault: () => {
            return self._default || self.readDefault();
        },
        properties: (event) => {
            event.preventDefault();
            event.cancelBubble = true;
            let id;
            self.getDefault().then((content) => {
                id = content.id;
                modal.open('cms/cms/properties', {
                    properties: content.props,
                    definitions: Object.keys(content.template.props).map((key) => {
                        return {
                            $key: key,
                            item: content.template.props[key]
                        };
                    })
                }, function (rootNode, vars, resolve) {
                    lackey.bind('lky:close', 'click', () => {
                        resolve(lackey.form(rootNode));
                    }, rootNode);
                }).then((props) => {
                    console.log(props);
                    contents[id].props = props;
                    self.refresh();
                    self.preview();
                });
            });
        },

        addBlock: (contentId, path) => {
            api.read('/cms/template?type=block')
                .then((templates) => {
                    return modal.open('cms/cms/blocks', {
                        templates: templates.data
                    }, function (rootNode, vars, resolve) {
                        lackey.bind('lky:close', 'click', () => {
                            resolve(lackey.hook('template').value);
                        }, rootNode);
                    });
                }).then((_template) => {
                    let source = treeParser.get(contents[contentId].layout, path, null, null, null);
                    if (!source) {
                        source = {
                            type: 'List',
                            items: []
                        };
                    }
                    source.items.push({
                        type: 'Block',
                        fields: {},
                        template: _template
                    });
                    treeParser.set(contents[contentId].layout, path, source, '*', null, null);
                    self.refresh();
                    self.preview();
                });
        },

        taxonomy: (event) => {

            event.preventDefault();
            event.cancelBubble = true;
            api.read('/cms/taxonomy-type')
                .then((data) => {
                    modal.open('cms/cms/taxonomy', {
                        types: data.data
                    }, function (rootNode, vars, resolve) {

                        let currentType = 'tag';

                        function loadCurrent(type) {
                            self.getDefault()
                                .then((content) => {
                                    let taxonomies = content.taxonomies.filter((item) => {
                                        return item.type.name === type;
                                    });
                                    return template.redraw('items', {
                                            bullets: taxonomies,
                                            remove: true
                                        }, rootNode)
                                        .then(() => {
                                            lackey.bind('button', 'click', (event2, button) => {
                                                event2.preventDefault();
                                                event2.cancelBubble = true;
                                                self.getDefault().then((content2) => {
                                                    return api.delete('/cms/content/' + content2.id + '/taxonomy', {
                                                        name: button.getAttribute('data-name')
                                                    }).then((updated) => {
                                                        self._default = Promise.resolve(updated);
                                                        loadCurrent(type);
                                                    });
                                                });
                                                return false;
                                            }, lackey.hook('items', rootNode));
                                        });
                                });
                        }

                        function loadType(type) {

                            currentType = type;

                            lackey.hooks('taxonomyTab').forEach((elem) => {
                                if (elem.getAttribute('data-name') === type) {
                                    lackey.addClass(elem, 'active');
                                } else {
                                    lackey.removeClass(elem, 'active');
                                }
                            });

                            loadCurrent(type);

                            api.read('/cms/taxonomy?type=' + type)
                                .then((list) => {
                                    return template.redraw('cloud', {
                                        bullets: list.data
                                    }, rootNode);
                                })
                                .then(() => {
                                    lackey.bind('button', 'click', (event3, button) => {
                                        event3.preventDefault();
                                        event3.cancelBubble = true;
                                        self.getDefault().then((content) => {
                                            return api.create('/cms/content/' + content.id + '/taxonomy', {
                                                name: button.getAttribute('data-name'),
                                                type: type
                                            }).then((updated) => {
                                                self._default = Promise.resolve(updated);
                                                loadCurrent(type);
                                            });
                                        });
                                        return false;
                                    }, lackey.hook('cloud', rootNode));
                                });

                        }

                        lackey.bind('lky:add-taxonomy', 'submit', (event4, hook) => {
                            event4.preventDefault();
                            event4.cancelBubble = true;
                            self.getDefault().then((content) => {
                                return api.create('/cms/content/' + content.id + '/taxonomy', {
                                    type: currentType,
                                    label: lackey.form(hook).label
                                }).then((updated) => {
                                    self._default = Promise.resolve(updated);
                                    loadCurrent(currentType);
                                });
                            });
                            return false;
                        }, rootNode);

                        lackey.bind('lky:taxonomyTab', 'click', (event5, hook) => {
                            event5.preventDefault();
                            event5.cancelBubble = true;
                            loadType(hook.getAttribute('data-name'));
                            return false;
                        }, rootNode);

                        loadType(currentType);

                        lackey.bind('lky:close', 'click', () => resolve(), rootNode);
                    });
                });
            return false;
        },
        setVisibility: function (value) {
            if (self.visibility) {
                lackey[value ? 'addClass' : 'removeClass'](self.visibility, 'published');
            }
            Object.keys(contents).forEach((key) => {
                contents[key].state = value ? 'published' : 'draft';
            });
            self.refresh();
        },
        getVisibility: function () {
            return Object.keys(contents)
                .map((key) => {
                    return contents[key].state === 'published';
                })
                .reduce((prev, curr) => {
                    if (prev || curr) {
                        return true;
                    }
                    return false;
                }, false);
        },
        toggleVisibility: function (event) {
            event.preventDefault();
            event.cancelBubble = true;
            self.setVisibility(!self.getVisibility());
            return false;
        },
        get: (contentId, path, variant, schema) => {
            let source = treeParser.get(contents[contentId].layout, path, variant, null, locale);

            if (!source) {
                source = schema.newDoc();
            }
            return source;
        },
        setAuthor: (contentId, value) => {
            contents[contentId].author = value;
            self.refresh();
        },
        setRelated: (contentId, value, index) => {
            contents[contentId].layout.related = contents[contentId].layout.related || {};
            contents[contentId].layout.related[index] = value ? {
                type: 'Ref',
                ref: value
            } : null;
            self.refresh();
            self.preview();
        },
        set: (contentId, path, variant, value) => {
            treeParser.set(contents[contentId].layout, path, value, variant || '*', null, locale);
            //TODO
            self.refresh();
        },
        save() {
            return Promise.all(Object.keys(contents).map((id) => {
                var json = contents[id];
                return api.update('/cms/content/' + id, json).then((response) => {
                    contents[id] = response;
                    return true;
                });
            })).then(() => {
                self.setVisibility(self.getVisibility());
                self.refresh();
            });
        },
        cancel() {
            document.location.reload(true);
        },
        load(contentIds) {

            if (!this._loader) {

                this._loader = Promise.all(contentIds.map((id) => {
                        return api.read('/cms/content/' + id).then((json) => {
                            contents[json.id] = json;
                            if (!json.layout) {
                                json.layout = {
                                    type: 'Fields'
                                };
                            }
                            return true;
                        });
                    }))
                    .then(() => {
                        cache = _.cloneDeep(contents);
                        self.setVisibility(self.getVisibility());
                        self.refresh();
                    });
            }
            return this._loader;
        }
    };


self = LackeyPageManager;
lackey.manager = LackeyPageManager;
module.exports = LackeyPageManager;
