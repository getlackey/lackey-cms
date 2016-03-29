/* eslint no-cond-assign:0 */
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
    TreeView = require('../components/treeview.js'),
    _ = require('lodash'),
    diff = require('jsondiffpatch'),
    diffFormatters = require('jsondiffpatch/src/main-formatters'),
    api = require('../api'),
    modal = require('./../../../../core/client/js/modal'),
    template = require('./../../../../core/client/js/template'),
    treeParser = require('./../../../shared/treeparser'),
    Structure = require('./structure');

let contents = {},
    cache = {},
    contentsTree = new TreeView({
        selector: 'lky:cms.debug.contents',
        format: null
    }),
    visualdiff = lackey.hook('visualdiff');


function map(data, extraLabel) {
    let children = [];
    if (data.content) {
        children = children.concat(data.content.map((content) => map(content)));
    }
    if (data.fields) {
        children = children.concat(Object.keys(data.fields).map((field) => map(data.fields[field], field)));
    }
    return {
        label: (extraLabel ? extraLabel : '') + data.type,
        children: children
    };
}

function jsjp(input) {
    return JSON.parse(JSON.stringify(input));
}

let self,
    locale = null,
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
            contentsTree.setData({
                label: 'ROOT',
                children: Object.keys(contents).map((key) => map(contents[key]))
            });

        },
        init: (options) => {

            LackeyPageManager.readDefault();

            lackey.select('html').forEach((elem) => {
                locale = elem.getAttribute('lang');
            });

            if (options && options.controls) {
                if (options.controls.visibility) {
                    self.visibility = lackey.hook(options.controls.visibility);
                    lackey.bind(self.visibility, 'click', lackey.as(self.toggleVisibility, self));
                }
                if (options.controls.save) {
                    self.saveBtn = lackey.hook(options.controls.save);
                    lackey.bind(self.saveBtn, 'click', lackey.as(self.save, self));
                }
                if (options.controls.cancel) {
                    lackey.bind(options.controls.cancel, 'click', lackey.as(self.cancel, self));
                }
                if (options.controls.taxonomy) {
                    lackey.bind(options.controls.taxonomy, 'click', lackey.as(self.taxonomy, self));
                }
                if (options.controls.structure) {
                    LackeyPageManager.structure(options.controls.structure);
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
        structure: (selector) => {
            let view;
            return this.default.then((page) => {
                view = new Structure(page.layout, selector);
            });
        },
        capture: (event) => {
            event.preventDefault();
            event.cancelBubble = true;
            return false;
        },
        readDefault: () => {
            let location = top.location.pathname.replace(/^\/admin/, '');
            this.default = api.read('/cms/content?route=' + location).then((data) => {
                return data.data[0];
            });
            return this.default;
        },
        taxonomy: (event) => {
            let self = this;

            event.preventDefault();
            event.cancelBubble = true;
            api.read('/cms/taxonomy-type').then((data) => {
                modal.open('cms/cms/taxonomy', {
                    types: data.data
                }, function (rootNode, vars, resolve) {

                    let currentType = 'tag';

                    function loadCurrent(type) {
                        self.default.then((content) => {
                            let taxonomies = content.taxonomies.filter((item) => {
                                return item.type.name === type;
                            });
                            return template.redraw('items', {
                                    bullets: taxonomies,
                                    remove: true
                                }, rootNode)
                                .then(() => {
                                    lackey.bind('button', 'click', (event, button) => {
                                        event.preventDefault();
                                        event.cancelBubble = true;
                                        self.default.then((content) => {
                                            return api.delete('/cms/content/' + content.id + '/taxonomy', {
                                                name: button.getAttribute('data-name')
                                            }).then((updated) => {
                                                self.default = Promise.resolve(updated);
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
                                lackey.bind('button', 'click', (event, button) => {
                                    event.preventDefault();
                                    event.cancelBubble = true;
                                    self.default.then((content) => {
                                        return api.create('/cms/content/' + content.id + '/taxonomy', {
                                            name: button.getAttribute('data-name'),
                                            type: type
                                        }).then((updated) => {
                                            self.default = Promise.resolve(updated);
                                            loadCurrent(type);
                                        });
                                    });
                                    return false;
                                }, lackey.hook('cloud', rootNode));
                            });

                    }

                    lackey.bind('lky:add-taxonomy', 'submit', (event, hook) => {
                        event.preventDefault();
                        event.cancelBubble = true;
                        self.default.then((content) => {
                            return api.create('/cms/content/' + content.id + '/taxonomy', {
                                type: currentType,
                                label: lackey.form(hook).label
                            }).then((updated) => {
                                self.default = Promise.resolve(updated);
                                loadCurrent(currentType);
                            });
                        });
                        return false;
                    }, rootNode);

                    lackey.bind('lky:taxonomyTab', 'click', (event, hook) => {
                        event.preventDefault();
                        event.cancelBubble = true;
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
            return Promise.all(contentIds.map((id) => {
                return api.read('/cms/content/' + id).then((json) => {
                    contents[json.id] = json;
                    return true;
                });
            })).then(() => {
                cache = _.cloneDeep(contents);
                self.setVisibility(self.getVisibility());
                self.refresh();
            });
        }
    };


self = LackeyPageManager;
lackey.manager = LackeyPageManager;
module.exports = LackeyPageManager;
