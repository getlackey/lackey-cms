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
    lackey = require('core/client/js');

/**
 * @class
 */
class SettingsUI extends Picker {

    get template() {

        return 'cms/cms/settings-picker';
    }


    get uri() {

    }

    selected() {

    }

    buildUI() {

        let self = this;

        return super
            .buildUI()
            .then(element => {
                lackey.bind('[data-lky-open]', 'click', (event, hook) => {
                    let target = hook.getAttribute('data-lky-open');
                    switch(target) {
                        case 'meta':
                            return self.options.stack
                                .inspectMeta(self.options.context);
                        break;
                        case 'dimensions':
                            return self.options.stack
                                .inspectViews(self.options.context);
                        break;
                    }
                    self.reject();
                }, self.node);
                return element;
            });
    }

    query() {
        return Promise.resolve();
    }
}

module.exports = SettingsUI;
