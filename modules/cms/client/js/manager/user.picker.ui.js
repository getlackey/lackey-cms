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
const Picker = require('cms/client/js/manager/picker.ui.js'),
      lackey = require('core/client/js'),
      template = require('core/client/js/template'),
      api = require('core/client/js/api');

/**
 * @class
 */
class UserPickerUI extends Picker {

    get template() {

        return 'cms/cms/user-picker';
    }

    get uri() {

        return '/cms/user?&q=';
    }

    selected(hook) {

        this.resolve(JSON.parse(hook.getAttribute('data-lky-user')));
    }

    query(page) {
        let
            self = this,
            input = lackey.select('input[type="search"]', this.node)[0],
            currentPage = page || 1;
        api
            .read(self.uri + encodeURI(input.value) + '&page=' + currentPage)
            .then(list => {
                return template.redraw(lackey.select('ul', self.node)[0], list);
            })
            .then(nodes => {
                lackey.bind('[data-lky-hook=table-paging]', 'click', (event, hook) => {
                    event.preventDefault();
                    var thisPage = hook.dataset.page;
                    console.log(thisPage);
                    self.query(thisPage);
                }, nodes[0]);
                lackey.bind('[data-lky-btn]', 'click', (event, hook) => {
                    self.selected(hook);
                }, nodes[0]);
            });
    }

}

module.exports = UserPickerUI;
