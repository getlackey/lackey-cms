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
const Picker = require('cms/client/js/manager/picker.ui.js');

/**
 * @class
 */
class BlockPrickerUI extends Picker {

    get template() {

        return 'cms/cms/block-picker';
    }

    get uri() {

        return '/cms/template?limit=100&type=block&q=';
    }

    selected(hook) {

        this.resolve(hook.getAttribute('data-lky-path'));
    }
}

module.exports = BlockPrickerUI;
