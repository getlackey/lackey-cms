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
    Picker = require('cms/client/js/manager/picker.ui.js'),
    api = require('core/client/js/api'),
    lackey = require('core/client/js');

/**
 * @class
 */
class ViewsUI extends Picker {

    get template() {

        return 'cms/cms/views-picker';
    }


    get uri() {

    }

    selected() {

    }

    buildUI() {

        let
            self = this;

        self.options.locale = self.options.stack.manager.locale;
        self.options.variant = self.options.stack.manager.variant;

        return Promise
            .all([
                api
                    .read('/cms/language?enabled=true')
                    .then(locs => {
                    self.options.locales = locs.data;
                }),

                api
                    .read('/view-as')
                    .then(response => {
                    self.options.viewAs = response;
                })
            ])
            .then(() => super.buildUI())
            .then(root => {
                lackey
                    .bind('[data-lky-variant]', 'change', self.viewInVariant.bind(self), root);
                lackey
                    .bind('[data-lky-locale]', 'change', self.viewInLocale.bind(self), root);
                lackey
                    .bind('[data-lky-view-as]', 'change', self.viewAs.bind(self), root);
                return root;
            });
    }

    viewAs(event, hook) {

        top.Lackey.setCookie('lky-view-as', hook.value);
        this.options.stack.manager.preview();
        return;
    }

    viewInVariant(event, hook) {

        this.options.stack.manager.preview(hook.value);
        return;
    }

    viewInLocale(event, hook) {

        this.options.stack.manager.preview(undefined, hook.value);
        return;
    }

    query() {
        return Promise.resolve();
    }
}

module.exports = ViewsUI;
