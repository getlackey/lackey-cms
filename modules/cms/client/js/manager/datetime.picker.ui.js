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
const Emitter = require('cms/client/js/emitter').Emitter,
    lackey = require('core/client/js'),
    template = require('core/client/js/template');

/**
 * @class
 */
class DateTimePicker extends Emitter {

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
        this._locked = null;
        // http://stackoverflow.com/a/12372720/2802756
        this._value = (options.current && options.current.getTime() === options.current.getTime()) ? options.current : new Date();
        this._viewing = this._value;
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
        let self = this,
            options = this.getOptions();
        return template
            .render('cms/cms/datetime-picker', options)
            .then((nodes) => {
                self.node = nodes[0];

                return self.redraw(options);
            });
    }
    redraw(options) {

        let self = this;

        return template
            .redraw(self.node.querySelector('[data-lky-hook="settings.picker"]'), options)
            .then(() => {

                lackey.bind('[data-lky-hook="settings.back"]', 'click', () => {
                    self.resolve(null);
                }, self.node);

                lackey.bind('[data-date]', 'click', (event, hook) => {
                    event.preventDefault();
                    event.stopPropagation();
                    let date = new Date(hook.getAttribute('data-date'));
                    this.resolve(date);
                }, self.node);

                lackey.bind('[data-previous-month]', 'click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    self._viewing = new Date(self._viewing.getFullYear(), self._viewing.getMonth() - 1, 1, 12, 0, 0, 0);
                    self.redraw(self.getOptions());
                }, self.node);

                lackey.bind('[data-next-month]', 'click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    self._viewing = new Date(self._viewing.getFullYear(), self._viewing.getMonth() + 1, 1, 12, 0, 0, 0);
                    self.redraw(self.getOptions());
                }, self.node);

                return self.node;

            });
    }


    getOptions() {
        let options = this.options,
            v = this._viewing,
            firstOfMonth = new Date(v.getFullYear(), v.getMonth(), 1, 12, 0, 0, 0),
            dow = firstOfMonth.getDay() - 1,
            currentRow = [],
            rows = [currentRow],
            nextDate = firstOfMonth;

        while (firstOfMonth.getMonth() === nextDate.getMonth()) {
            if (firstOfMonth === nextDate) {
                while (dow-- > 0) {
                    currentRow.push(null);
                }
            }
            if (currentRow.length > 6) {
                currentRow = [];
                rows.push(currentRow);
            }
            currentRow.push(nextDate);
            nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate() + 1, 12, 0, 0, 0);
        }
        while (currentRow.length < 7) {
            currentRow.push(null);
        }
        options.viewing = this._viewing;
        options.calendar = rows;

        return options;
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

}

module.exports = DateTimePicker;