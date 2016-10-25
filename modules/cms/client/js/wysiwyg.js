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
*/
const
    lackey = require('core/client/js'),
    Media = require('cms/client/js/media'),
    MeMarkdown = require('medium-editor-markdown'),
    MediumEditor = require('medium-editor'),
    debug = require('debug')('lackey-cms/modules/cms/client/js/wysiwyg'),
    markdown = require('cms/shared/markdown'),
    Insert = require('medium-editor-vanilla-insert')({
        MediumEditor: MediumEditor
    }),
    Plain = require('medium-editor-remove-formats')(),
    inlineButtons = [
        'bold',
        'italic',
        'underline',
        'plain'
    ],
    buttons = inlineButtons.concat([
        'anchor',
        'quote',
        'pre',
        'orderedlist',
        'unorderedlist',
        'h2',
        'h3'
    ]);

let pool = [];

class Wysiwyg {

    constructor(element) {

        debug('Constructor', element);

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
            insertButtons = [],
            options = {
                paste: {}
                //disableDoubleReturn: true
            },
            customButtons = this._element.getAttribute('data-lky-buttons');

        if (customButtons) {
            customButtons = customButtons.split(',');
        }


        if (this._element.hasAttribute('data-lky-singleline')) {
            //options.disableReturn = true;
            options.toolbar = {
                buttons: customButtons || inlineButtons
            };
        } else {
            insertButtons = ['insert-media'];
            options.toolbar = {
                buttons: customButtons || buttons
            };
            options.insert = {
                buttons: ['image']
            };
        }

        var InsertMedia = MediumEditor.Extension.extend({
            name: 'insert-media',
            getButton: function (editor, getter) {
                var btn = document.createElement('button');
                btn.innerText = 'Media';
                btn.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();

                    top.LackeyManager
                        .stack
                        .inspectMedia({}, null)

                    .then(result => {

                        if (result) {
                            let
                                node = getter(),
                                media = new Media(null, true);
                            media.node = node;
                            media.set(result);
                            Wysiwyg.initInTextMedia(media);
                            media.node.parentNode.dispatchEvent(new Event('change'));

                        }
                    });

                }, true);
                return btn;
            }
        });

        options.extensions = {

            plain: new Plain({}),
            markdown: new MeMarkdown({
                toMarkdownOptions: {
                    converters: [
                        {
                            filter: 'br',
                            replacement: () => '<br />'
                        },
                        {
                            filter: node => ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'video', 'iframe', 'strong', 'em', 'sup', 'sub', 'ul', 'ol', 'li', 'a', 'br', 'blockquote'].indexOf(node.nodeName.toLowerCase()) === -1,
                            replacement: content => content
                        },
                        {
                            filter: 'iframe',
                            replacement: (content, node) => '!iframe[](' + node.src + ')'
                        },
                        {
                            filter: 'video',
                            replacement: (content, node) => '!video[](' + node.src + ')'
                        },
                        {
                            filter: 'img',
                            replacement: (content, node) => {
                                var alt = node.alt || '';
                                var src = node.getAttribute('src') || '';
                                var title = node.title || '';
                                var titlePart = title ? ' "' + title + '"' : '';
                                var type = '';

                                if (src && node.hasAttribute('markdown-type')) {
                                    type = node.getAttribute('markdown-type');
                                    src = node.getAttribute('markdown-src');
                                    return '@[' + type + ']' + '(' + src + ')';
                                }
                                return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : '';
                            }
                        }
                    ]
                }
            }, text => {

                if (self._lock) {
                    return;
                }
                self._changed = true;

                top.LackeyManager.set(self.id, self.path, self.variant, text);

            })
        };

        if (insertButtons.length) {
            options.extensions.insertMedia = new InsertMedia();
            options.extensions.insert = new Insert({
                buttons: insertButtons
            });
        }

        self._lock = true;
        let editor = new MediumEditor(this._element, options);
        editor.subscribe('editableKeydownEnter', function (event) {
            if (event.shiftKey) {
                //var node = MediumEditor.selection.getSelectionStart(editor.options.ownerDocument);
                MediumEditor.util.insertHTMLCommand(editor.options.ownerDocument, '[BR]');
                self._element.innerHTML = self._element.innerHTML.replace(/\[BR\]/g, '<br />');
                self._element.dispatchEvent(new Event('change'));
                event.preventDefault();
            } else if (self._element.hasAttribute('data-lky-singleline')) {
                event.preventDefault();
            }
        });

        Array.prototype.slice
            .call(this._element.querySelectorAll('img, video'))
            .forEach(element => Wysiwyg.initInTextMedia(new Media(element, true)));

        self._lock = false;

    }

    static initInTextMedia(media) {

        media.selected(mediaObject => {

            top.LackeyManager
                .stack
                .inspectMedia(mediaObject.media, mediaObject.node)

            .then(result => {
                if (result) {
                    mediaObject.set(result);
                }
                if (result === -1) {
                    mediaObject.node.parentNode.removeChild(mediaObject.node);
                }
                var event = new Event('change');
                mediaObject.node.parentNode.dispatchEvent(event);
            });
        });
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
