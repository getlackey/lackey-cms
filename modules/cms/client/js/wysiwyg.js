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
*/
const
    lackey = require('core/client/js'),
    Media = require('cms/client/js/media');

let pool = [],
    style = ``,
    styleBlock = document.createElement('style');

styleBlock.innerHTML = style;
document.body.appendChild(styleBlock);

class Wysiwyg {

    constructor(div) {
        /*
        var self = this;

        this._div = div;
        this._changed = false;
        this._wrap = div.getAttribute('data-lky-type') || 'doc';
        this.variant = div.getAttribute('data-lky-variant') || '*';
        this._placeholder = div.getAttribute('placeholder') || 'Type here';

        this._schema = LackeySchema;
        if (this._wrap === 'inline') {
            this._schema = InlineSchema;
        }
        this._contentId = div.getAttribute('data-lky-content');
        this._path = div.getAttribute('data-lky-path') || null;

        top.LackeyManager
            .get(this.contentId, this.path, this.variant, this._schema)
            .then(function (source) {
                self._source = source;
                self.render();
                top.LackeyManager.on('reset', (event) => {
                    if (event.data.type === 'content' && +event.data.id === +self._contentId) {
                        top.Lackey
                            .manager
                            .get(self.contentId, self.path, self.variant, self._schema)
                            .then((src) => {
                                self._source = src;
                                self._lock = true;
                                self._pm.setContent(src, 'json');
                                self._lock = false;
                            });
                    }
                });
            });*/
    }

    get contentId() {
        return this._contentId;
    }

    get path() {
        return this._path;
    }

    ready() {

    }
    isEmpty() {
        return (this._pm.getContent('text').replace(/^\s+|\s+$/g, '').length === 0);
    }
    render() {

        this._div.style.minHeight = '50px';

        let pm,
            self = this,
            options = {
                place: this._div,
                schema: self._schema,
                docFormat: typeof this._source === 'string' ? 'text' : 'json',
                doc: this._source
            };

        try {
            //this._pm = pm = new ProseMirror(options);

            let overlay = document.createElement('div');

            overlay.style.pointeEvents = 'none';
            overlay.style.position = 'absolute';
            overlay.style.display = 'none';
            overlay.innerText = this._placeholder;
            overlay.style.width = '100%';
            overlay.style.opacity = 0.5;
            overlay.style.textAling = 'center';
            this._div.parentNode.insertBefore(overlay, this._div);

            if (!window.getComputedStyle(overlay.parentNode).position) {
                overlay.parentNode.style.position = 'relative';
                overlay.style.transform = 'translateY(-50%)';
                overlay.style.top = '50%';
            }

            if (self.isEmpty()) {
                overlay.style.display = 'block';
            }

            pm.on('focus', function () {
                overlay.style.display = 'none';
            });

            pm.on('blur', function () {
                if (self.isEmpty()) {
                    overlay.style.display = 'block';
                }
            });

            pm.setOption('tooltipMenu', {
                selectedBlockMenu: true
            });

            /*pm.setOption('menuBar', {
                float: true
            });*/

            pm.on('change', function () {
                if (this._lock) {
                    return;
                }
                self._changed = true;
                let newContent = pm.getContent('json');
                top.LackeyManager.set(self.contentId, self.path, self.variant, newContent);
            });
        } catch (error) {
            console.error('this', this);
            console.error(error.stack);
            throw error;

        }

    }

    static factory(div) {
        return new Wysiwyg(div);
    }

    static init() {

        if(!top.Lackey || !top.LackeyManager) {
            setTimeout(() => {
                Wysiwyg.init();
            }, 250);
            return;
        }

        lackey.getWithAttribute('data-lky-pm').forEach(Wysiwyg.factory);

        lackey.select('[data-lky-media]').forEach((element) => {
            let media = new Media(element);
            media.selected((mediaObject) => {

                top.LackeyManager.stack
                    .inspectMedia(mediaObject.media, mediaObject.node)

                    .then((result) => {
                        if (result || result === -1) {
                            mediaObject.set(result !== -1 ? result : null);
                            mediaObject.notify();
                        }
                    });
            });
        });
    }

    static getContents() {
        let content = [];
        pool.forEach((instance) => {
            if (content.indexOf(instance.contentId) === -1) {
                content.push(instance.contentId);
            }
        });
        return content;
    }

    static get pool() {
        return pool;
    }

}

module.exports = Wysiwyg;
