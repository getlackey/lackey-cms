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
    mimes = require('mime/types.json'),
    mime = Object
    .keys(mimes)
    .map((key) => {
        let type = key.split('/')[0];
        if (type === 'application') {
            type = 'file';
        }
        return {
            mime: key,
            label: type + ' ' + mimes[key][0],
            type: type
        };
    })
    .sort((a, b) => {
        if (a.label === b.label) {
            return 0;
        }
        return a.label < b.label ? -1 : 0;
    });

/**
 * @class
 */
class SourcesEditorUI extends Picker {

    get template() {

        return 'cms/cms/source-editor';
    }


    get uri() {

    }

    selected() {

    }

    buildUI() {

        let self = this;

        this.options.mimes = mime;

        return super
            .buildUI()
            .then(element => {
                lackey.bind('lky:save', 'click', () => {
                    self.resolve(lackey.form(self.node));
                }, self.node);
                return element;
            });
    }

    query() {
        return Promise.resolve();
    }
}

module.exports = SourcesEditorUI;
