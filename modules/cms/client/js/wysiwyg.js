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
    lackey = require('./../../../core/client/js'),
    LackeySchema = require('../../shared/content-blocks').LackeySchema,
    InlineSchema = require('../../shared/inline'),
    edit = require('prosemirror/dist/edit'),
    ProseMirror = edit.ProseMirror;

//require('prosemirror/dist/inputrules/autoinput');
require('prosemirror/dist/menu/tooltipmenu');

let pool = [];

class Wysiwyg {

    constructor(div) {

        this._div = div;
        this._changed = false;
        this._wrap = div.getAttribute('data-lky-type') || 'doc';
        this.variant = div.getAttribute('data-lky-variant') || 'default';

        this._schema = LackeySchema;
        if (this._wrap === 'inline') {
            this._schema = InlineSchema;
        }
        this._contentId = div.getAttribute('data-lky-content');
        this._path = div.getAttribute('data-lky-path') || null;

        pool.push(this);
    }

    get contentId() {
        return this._contentId;
    }

    get path() {
        return this._path;
    }

    ready() {
        this._source = Wysiwyg.manager.get(this.contentId, this.path, this.variant, this._schema);
        this.render();
    }

    render() {

        this._div.style.border = '1px solid red';
        this._div.style.minHeight = '50px';

        let pm,
            self = this,
            options = {
                place: this._div,
                schema: self._schema,
                docFormat: 'json',
                doc: this._source
            };

        try {
            this._pm = pm = new ProseMirror(options);
            /*
            let tooltip = new Tooltip(pm.wrapper, 'below'),
                tooltipOpen;

            pm.content.addEventListener('keydown', () => {
                tooltip.close();
                tooltipOpen = null;
            });

            pm.content.addEventListener('mousedown', () => {
                tooltip.close();
                tooltipOpen = null;
            });

            pm.setOption("menuBar", false);
            */

            pm.setOption('tooltipMenu', {
                selectedBlockMenu: true
            });

            pm.on('change', function () {
                self._changed = true;
                let newContent = pm.getContent('json');
                Wysiwyg.manager.set(self.contentId, self.path, self.variant, newContent);
            });
        } catch (error) {
            console.error('this', this);
            console.error(error.stack);
            throw error;

        }


    }

    static get manager() {
        return top.Lackey.manager;
    }

    static factory(div) {
        return new Wysiwyg(div);
    }

    static init() {
        lackey.getWithAttribute('data-lky-pm').forEach(Wysiwyg.factory);
        return Wysiwyg.manager.load(Wysiwyg.getContents())
            .then(() => pool.forEach((instance) => instance.ready())).catch((error) => {
                throw error;
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
        /*
            static save(id) {
                return api.update('/cms/content/' + id, {
                    layout: contents[id]
                });
            }

            static saveAll() {
                return BbPromise.all(Object.keys(contents).map((id) => {
                    return Wysiwyg.save(id);
                }));

            static onChange(callback) {
                changeCallbacks.push(callback);
            }
            */


}

module.exports = Wysiwyg;
