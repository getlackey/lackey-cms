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
    lackey = require('core/client/js'),
    api = require('core/client/js/api');

/**
 * @class
 */
class TaxonomyPickerUI extends Picker {

    get template() {

        return 'cms/cms/taxonomy-picker';
    }

    get uri() {

        return '/cms/taxonomy?type=' + this.options.type + '&q=';
    }

    selected(hook) {
        this.resolve(hook.getAttribute('data-lky-data'));
    }

    buildUI() {
        let self = this;
        return super
            .buildUI()
            .then(response => {
            self.addButton = lackey.select('[data-lky-hook="create-taxonomy"]', self.node)[0];
                if(!this.options.addable) {
                    self.addButton.style.display = 'none';
                    return response;
                }

                self.addButton.addEventListener('click', self.addTaxonomy.bind(self), true);
                return response;
            });
    }

    addTaxonomy() {
        let
            self = this,
            input = lackey.select('input[type="search"]', this.node)[0],
            value = input.value.replace(/^\s+|\s+$/g);
        if (value.length >= 3) {
            api
                .create('/cms/taxonomy', {
                    type: this.options.type,
                    name: value,
                    label: value
                })
                .then(val => self.resolve(JSON.stringify(val)));
        }
    }

    query(page) {
        let self = this,
            input = lackey.select('input[type="search"]', this.node)[0],
            currentPage = page || 1;
        api
            .read('/cms/taxonomy?type=' + this.options.type + '&page=' + currentPage + '&limit=10' + '&q=' + encodeURI(input.value))
            .then(list => {
                return template.redraw(lackey.select('[data-lky-hook="settings.picker"] [data-lky-template]', self.node)[0], list);
            })
            .then(nodes => {
                lackey.bind('[data-lky-hook=table-paging]', 'click', (event, hook) => {
                    event.preventDefault();
                    var thisPage = hook.dataset.page;
                    self.query(thisPage);
                }, nodes[0]);
                 lackey.bind('[data-lky-btn]', 'click', (event, hook) => {
                    self.selected(hook);
                }, nodes[0]);
            });
    }

}

module.exports = TaxonomyPickerUI;
