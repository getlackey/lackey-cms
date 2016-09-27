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
    Media = require('cms/client/js/media'),
    MeMarkdown = require('medium-editor-markdown'),
    MediumEditor = require('medium-editor'),
    debug = require('debug')('lackey-cms/modules/cms/client/js/wysiwyg'),
    markdown = require('cms/shared/markdown'),
    inlineButtons = [
        'bold',
        'italic',
        'underline',
        'removeFormat'
    ],
    buttons = inlineButtons.concat([
        'anchor',
        'quote',
        'pre',
        'orderedlist',
        'unorderedlist',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'justifyFull',
        'h2',
        'h3'
    ]);

let pool = [];

class Wysiwyg {

    constructor(element) {

        debug('Constructor', element);

        var self = this;

        this._element = element;
        this._changed = false;
        this._variant = element.getAttribute('data-lky-variant') || '*';
        this._placeholder = element.getAttribute('placeholder') || 'Type here';

        this._contentId = element.getAttribute('data-lky-content');
        this._path = element.getAttribute('data-lky-path') || null;

        this.setup();

    }

    get id() {

        debug('get id');
        return this._contentId;
    }

    get path() {

        debug('get path');
        return this._path;
    }

    get variant() {

        debug('get variant');
        return this._variant;
    }

    setup() {
        let self = this;
        top.LackeyManager
            .get(this.id, this.path, this.variant)
            .then(source => {
                self._source = source;
                self.render();
                top.LackeyManager
                    .on('reset', event => {
                        if (event.data.type === 'content' && +event.data.id === +self.id) {
                            self.reset();
                        }
                    });
            });

    }

    reset() {
        let self = this;
        top.LackeyManager
            .get(self.id, self.path, self.variant)
            .then(src => {
                self._source = src;
                self._lock = true;
                self._element.innerHTML = markdown.toHTML(self._source, self._element.tagName);
                self._lock = false;
            });
    }

    render() {

        debug('render');

        let
            self = this,
            options = {
                paste: {
                    cleanPastedHTML: true
                },
                extensions: {
                    markdown: new MeMarkdown(text => {
                        if (self._lock) {
                            return;
                        }
                        self._changed = true;
                        top.LackeyManager.set(self.id, self.path, self.variant, text);

                    })
                }
            };


        if (this._element.hasAttribute('data-lky-singleline')) {
            options.disableReturn = true;
            options.toolbar = {
                buttons: inlineButtons
            };
        } else {
            options.toolbar = {
                buttons: buttons
            };
        }

        self._lock = true;
        new MediumEditor(this._element, options);
        self._lock = false;

    }

    static factory(element) {

        debug('factory', element);
        return new Wysiwyg(element);
    }

    static init() {

        debug('init');

        if (!top.Lackey || !top.LackeyManager) {
            debug('init - wait');
            setTimeout(() => {
                Wysiwyg.init();
            }, 250);
            return;
        }

        lackey
            .getWithAttribute('data-lky-pm')
            .forEach(Wysiwyg.factory);

        lackey
            .select('[data-lky-media]')
            .forEach(Wysiwyg.initMedia);
    }

    static initMedia(element) {

        debug('initMedia', element);

        let media = new Media(element);
        media.selected(mediaObject => {

            top.LackeyManager
                .stack
                .inspectMedia(mediaObject.media, mediaObject.node)

            .then(result => {
                if (result || result === -1) {
                    mediaObject.set(result !== -1 ? result : null);
                    mediaObject.notify();
                }
            });
        });
    }


    static getContents() {

        debug('getContents');

        let content = [];
        pool
            .forEach(instance => {
                if (content.indexOf(instance.id) === -1) {
                    content.push(instance.id);
                }
            });
        return content;
    }

    static get pool() {

        debug('get pool');

        return pool;
    }

}

module.exports = Wysiwyg;
