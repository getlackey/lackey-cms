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
    MediumEditor = require('medium-editor');

let pool = [];

class Wysiwyg {

    constructor(div) {

        var self = this;

        this._div = div;
        this._changed = false;
        this._wrap = div.getAttribute('data-lky-type') || 'doc';
        this.variant = div.getAttribute('data-lky-variant') || '*';
        this._placeholder = div.getAttribute('placeholder') || 'Type here';

        this._contentId = div.getAttribute('data-lky-content');
        this._path = div.getAttribute('data-lky-path') || null;
        this.render();

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
            let
                options = {
                    extensions: {
                        markdown: new MeMarkdown(text => {
                            // todo
                        })
                    }
                };


            if(this._div.hasAttribute('data-lky-singleline')) {
                options.disableReturn = true;
            }

            new MediumEditor(this._div, options);


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

        if (!top.Lackey || !top.LackeyManager) {
            setTimeout(() => {
                Wysiwyg.init();
            }, 250);
            return;
        }

        lackey.getWithAttribute('data-lky-pm')
            .forEach(Wysiwyg.factory);

        lackey.select('[data-lky-media]')
            .forEach(element => {
                let media = new Media(element);
                media.selected(mediaObject => {

                    top.LackeyManager.stack
                        .inspectMedia(mediaObject.media, mediaObject.node)

                    .then(result => {
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
        pool.forEach(instance => {
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
