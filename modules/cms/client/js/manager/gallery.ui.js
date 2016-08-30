/* eslint no-cond-assign:0, no-new:0, no-alert:0 */
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
    template = require('core/client/js/template'),
    api = require('core/client/js/api'),
    Upload = require('core/client/js/upload'),
    Autocomplete = require('cms/client/js/controls/autocomplete'),
    mimes = require('mime/types.json'),
    mime = Object
    .keys(mimes)
    .map((key) => {
        let type = key.split('/')[0];
        if (type === 'application') {
            type = 'file';
        }
        return {
            mime: key,
            label: type + ' ' + mimes[key][0],
            type: type
        };
    })
    .sort((a, b) => {
        if (a.label === b.label) {
            return 0;
        }
        return a.label < b.label ? -1 : 0;
    });


/**
 * @class
 */
class Gallery extends Emitter {

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
    constructor(options) {
        super();
        this.options = options;
        this.options.mimes = mime;
        this._locked = null;
        let self = this;
        this.promise = new Promise((resolve, reject) => {
            self.resolve = resolve;
            self.reject = reject;
        });
    }

    /**
     * Builds UI
     * @returns {Promise<HTMLElement>}
     */
    buildUI() {
        let self = this;
        return template
            .render('cms/cms/gallery', this.options || {})
            .then((nodes) => {
                self.node = nodes[0];

                lackey.bind('[data-lky-hook="settings.back"]', 'click', () => {
                    self.resolve(null);
                }, self.node);

                if (!self.options.media || !self.options.media.id) {
                    self.node.setAttribute('data-lky-edit', 'gallery');
                    self.node.setAttribute('data-lky-has-media', 'false');
                } else {
                    self.node.setAttribute('data-lky-has-media', 'true');
                    self.node.setAttribute('data-lky-edit', 'meta');
                }

                lackey
                    .select([
                        '[data-lky-hook="settings.open.meta"]',
                        '[data-lky-hook="settings.open.gallery"]'
                    ], self.node)
                    .forEach((element) => {
                        element.addEventListener('click', self.toggle.bind(self), true);
                    });

                lackey
                    .select('[data-lky-hook="settings.open.clear"]', self.node)
                    .forEach((element) => {
                        element.addEventListener('click', () => self.resolve(-1), true);
                    });

                lackey
                    .select('[data-lky-hook="settings.open.url"]', self.node)
                    .forEach((element) => {
                        element.addEventListener('click', () => {
                            let value = prompt('Please enter URL');
                            if (!value) {
                                return;
                            }
                            api
                                .create('/cms/media', {
                                    source: value
                                })
                                .then((media) => {
                                    self.resolve(media);
                                });
                        }, true);
                    });

                self.zone = new Upload(lackey.hook('settings.open.upload', self.node), true);
                self.zone.on('done', (uploader, images) => {
                    if (images && images.length) {
                        self.resolve(images[0].data);
                    }
                });

                self.query();

                lackey.bind('input[data-lky-hook="alt"]', 'keyup', self.altChange.bind(self), self.node);
                lackey.bind('select[data-lky-hook="mime"]', 'change', self.mimeChange.bind(self), self.node);

                lackey.bind('input[type="search"]', 'keyup', self.keyup.bind(self), self.node);

                if (self.options.media && self.options.media.type === 'video') {
                    self.alternative();
                }

                return self.drawTaxonomy();
            })
            .then(() => {
                return self.node;
            });
    }

    drawTaxonomy() {


        if (!this.options.media) return;

        let self = this,
            context = self.options.media;


        let
            restrictionNode = lackey.hook('restricitons', this.node),
            taxes = context.taxonomies || [],
            restrictive = taxes.filter((tax) => tax.type && tax.type.restrictive),
            options = {
                createNew: false,
                separators: [
                            13,
                            20
                        ],
                formatLabel: (item) => {
                    return (item.type ? item.type.label + ': ' : '') + (item.label || item.name);
                },
                equals: (item, term) => {
                    return item.label === term;
                }

            },
            restrictiveControl = new Autocomplete(restrictionNode, lackey.merge(options, {
                query: (text) => {
                    return api
                        .read('/cms/taxonomy?restrictive=1&name=' + encodeURI(text + '%'))
                        .then((data) => data.data);
                },
                value: restrictive
            })),
            handler = () => {

                context.taxonomies = [].concat(restrictiveControl.value);
                top.Lackey.manager.setMedia(context.id, context);
            };
        restrictiveControl.on('changed', handler);

    }

    alternative() {
        let self = this;
        return template
            .redraw(lackey.hook('sources', this.node), this.options)
            .then(() => {
                lackey.bind('lky:add', 'click', () => {
                    let
                        sourceNode = lackey.hook('new-source', this.node),
                        mimeNode = lackey.hook('new-mime', this.node),
                        mediaNode = lackey.hook('new-media', this.node);
                    return self.addAlternative(sourceNode.value, mimeNode.value, mediaNode.value);
                });

                lackey.bind('lky:remove', 'click', (event, hook) => {
                    let index = hook.getAttribute('data-lky-idx');
                    return top.Lackey.manager
                        .getMedia(self.options.media.id)
                        .then((media) => {
                            media.alternatives = media.alternatives || [];
                            media.alternatives.splice(index, 1);
                            return top.Lackey.manager.setMedia(media.id, media);
                        })
                        .then((media) => {
                            self.options.media = media;
                            return self.alternative();
                        });
                });

                let zone = new Upload(lackey.hook('source-upload', self.node), true, true);
                zone.on('done', (uploader, images) => {
                    if (images && images.length) {
                        let
                            mimeNode = lackey.hook('new-mime', this.node),
                            mediaNode = lackey.hook('new-media', this.node);
                        return self.addAlternative(images[0].data, mimeNode.value, mediaNode.value);
                    }
                });
            });
    }

    addAlternative(source, mimeType, mediaQuery) {
        let self = this;
        return top.Lackey.manager
            .getMedia(this.options.media.id)
            .then((media) => {
                media.alternatives = media.alternatives || [];
                media.alternatives.push({
                    source: source,
                    mime: mimeType,
                    media: mediaQuery
                });
                return top.Lackey.manager.setMedia(media.id, media);
            })
            .then((media) => {
                self.options.media = media;
                return self.alternative();
            });
    }

    altChange(event, hook) {
        top.Lackey.manager
            .getMedia(this.options.media.id)
            .then((media) => {
                media.attributes.alt = hook.value;
                top.Lackey.manager.setMedia(media.id, media);
            });
    }

    mimeChange(event, hook) {
        top.Lackey.manager
            .getMedia(this.options.media.id)
            .then((media) => {
                media.mime = hook.value;
                top.Lackey.manager.setMedia(media.id, media);
            });
    }

    /**
     * KeyUp handler on search field
     */
    keyup() {
        let self = this;
        if (this._locked) {
            clearTimeout(this._locked);
        }
        this._locked = setTimeout(() => {
            self.query();
        }, 100);
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
            }, 50);
        });
    }

    /**
     * Makes fade out animation
     * @returns {Promise}
     */
    remove() {
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

    /**
     * Updates list of pages
     * @returns {Promise}
     */
    query() {
        let self = this,
            input = lackey.select('input[type="search"]', this.node)[0];
        api
            .read('/cms/media?q=' + encodeURI(input.value))
            .then((list) => {
                return template.redraw(lackey.select('[data-lky-hook="settings.gallery"] tbody', self.node)[0], list);
            })
            .then((nodes) => {
                lackey.bind('[data-lky-btn]', 'click', (event, hook) => {
                    self.resolve(JSON.parse(hook.getAttribute('data-lky-media')));
                }, nodes[0]);
            });
    }

}

module.exports = Gallery;
