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
    lackey = require('core/client/js'),
    api = require('core/client/js/api'),
    template = require('core/client/js/template');

let cache = {};

/**
 * @class
 */
class Template {

    /**
     * Gets template meta data
     * @param   {string} templatePath
     * @param   {number} index
     * @returns {Promise<object>}
     */
    static readTemplate(templatePath, index) {

        if (typeof templatePath === 'object') {
            return Promise.resolve(templatePath);
        }

        cache[templatePath] = cache[templatePath] || api
            .read('/cms/template?path=' + encodeURI(templatePath) + '&limit=1')
            .then(data => {
                let ctx = {};
                if (data && data.data && data.data.length) {
                    ctx = data.data[0];
                }
                return ctx;

            });

        return cache[templatePath]
            .then(ctx => {
                let result = JSON.parse(JSON.stringify(ctx));
                result.$idx = index;
                return result;
            });
    }
}
module.exports = Template;

