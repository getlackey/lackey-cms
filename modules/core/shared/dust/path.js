/* jslint node:true, esnext:true */
/* eslint no-param-reassign:0 */
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

module.exports = (dust) => {

    function crawl(obj, path) {
        if (!obj) return null;
        if (!path) return obj;
        if (path.indexOf('.') === -1) {
            return obj[path];
        }
        let elems = path.split('.'),
            next = elems.shift();
        return crawl(obj[next], elems.join('.'));
    }

    dust.helpers.path = function (chunk, context, bodies, params) {

        let root = params.root || null,
            path = params.path + '',
            filters = params.filters || [],
            value = crawl(root, path);

        filters.forEach((filter) => {
            value = dust.filters[filter](value);
        });

        if (!bodies.block) {
            chunk.write(value);
        } else {
            let template = value ? bodies.block : bodies.else;

            if (template) {
                chunk = chunk.render(template, context.push(value));
            }
            return chunk;

        }

    };
};
