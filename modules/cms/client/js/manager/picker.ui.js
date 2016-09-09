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
    Emitter = require('cms/client/js/emitter').Emitter,
    lackey = require('core/client/js'),
    template = require('core/client/js/template'),
    api = require('core/client/js/api');

/**
 * @class
 */
class PickerUI extends Emitter {

    /**
     * @constructs lackey-cms/modules/cms/client/manager/PickerUI
     * @param {HTMLElement} rootNode
     */
    constructor(options) {

        super();
        this.options = options;
        this._locked = null;

        let self = this;

        this.promise = new Promise((resolve, reject) => {
            self.resolve = resolve;
            self.reject = reject;
        });
    }

    get template() {

        throw new Error('Impelement me!');
    }

    get uri() {

        throw new Error('Impelement me!');
    }

    selected() {

        throw new Error('Impelement me!');
    }

    /**
     * Builds UI
     * @returns {Promise<HTMLElement>}
     */
    buildUI() {

        let self = this;

        return template
            .render(self.template, this.options || {})
            .then(nodes => {

                self.node = nodes[0];

                lackey.bind('[data-lky-hook="settings.back"]', 'click', () => {
                    self.resolve(null);
                }, self.node);

                self.query();

                lackey.bind('input[type="search"]', 'keyup', self.keyup.bind(self), self.node);

                return self.node;
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
        this.node.setAttribute('data-lky-open', '');
        return Promise.resolve();
    }

    /**
     * Makes fade out animation
     * @returns {Promise}
     */
    remove() {
        this.node.parentNode.removeChild(this.node);
        this.node.removeAttribute('data-lky-open');
        return Promise.resolve();
    }

    /**
     * Updates list of pages
     * @returns {Promise}
     */
    query() {
        let
            self = this,
            input = lackey.select('input[type="search"]', this.node)[0];
        api
            .read(self.uri + encodeURI(input.value))
            .then(list => {
                return template.redraw(lackey.select('ul', self.node)[0], list);
            })
            .then(nodes => {
                lackey.bind('[data-lky-btn]', 'click', (event, hook) => {
                    self.selected(hook);
                }, nodes[0]);
            });
    }

}

module.exports = PickerUI;
