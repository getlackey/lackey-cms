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

    function renderParameter(name, chunk, context, bodies, params) {
        if (params && params[name]) {
            if (typeof params[name] === 'function') {
                var output = '';
                chunk.tap(function (data) {
                    output += data;
                    return '';
                }).render(params[name], context).untap();
                return output;
            } else {
                return params[name];
            }
        }
        return '';
    }

    function crawl(obj, path) {
        if (!obj) return null;
        if (!path && path !== 0) return obj;
        if (typeof path === 'number') return obj[path];
        if (path.indexOf('.') === -1) {
            return obj[path];
        }
        let elems = path.split('.'),
            next = elems.shift();
        return crawl(obj[next], elems.join('.'));
    }

    dust.helpers.path = function (chunk, context, bodies, params) {

        let root = params.root || null,
            prefixIfParent = params.prefixIfParent || '',
            parent = (params.parent && params.parent.replace(/^\s+|\s+/g).length > 0) ? prefixIfParent + params.parent : null,
            pathAsInt = !!params.pathAsInt && !parent,
            levelUpIfParent = parent ? +params.levelUpIfParent : 0;

        if(levelUpIfParent > 0) {
            parent = parent.split('.');
            while(levelUpIfParent > 0) {
                parent.pop();
                levelUpIfParent--;
            }
            parent = parent.join('.');
        }

        let
            path = pathAsInt ? +params.path : ((parent ? (parent + '.') : '') + renderParameter('path', chunk, context, bodies, params)),
            filters = params.filters || [];

        let value = crawl(root, path, levelUpIfParent),
            equals = params.hasOwnProperty('eq') ? params.eq : undefined,
            allowEmpty = !!params.allowEmpty,
            data = context.push((function (args) {
                var output = {};
                Object
                    .keys(args)
                    .filter((key) => {
                        return ['root', 'path', 'filters', 'eq'].indexOf(key) === -1;
                    })
                    .forEach((key) => {
                        output[key] = args[key];
                    });
                return output;
            })(params));

        filters.forEach((filter) => {
            value = dust.filters[filter](value);
        });

        if (equals !== undefined) {
            value = value === equals;
        }

        if (!bodies.block) {
            chunk.write(value);
        } else {
            let template = value ? bodies.block : bodies.else;

            if (!value && !template && allowEmpty) {
                template = bodies.block;
            }

            if (template) {
                chunk = chunk.render(template, data.push(value));
            }
            return chunk;

        }

    };
};
