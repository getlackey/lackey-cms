/* jslint node:true, esnext:true, -W053: true */
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

    dust.helpers.hashmap = function (chunk, context, bodies, params) {

        let map = params.map || {},
            as = params.iterator || '$key';

        let old = context.stack.head;
        Object.keys(map).forEach(function (key) {
            if(map[key]) {
                if(typeof map[key] === 'string') {
                    map[key] = new String(map[key]); // eslint-disable-line no-new-wrappers
                } else if(typeof map[key] === 'number') {
                    map[key] = new Number(map[key]); // eslint-disable-line no-new-wrappers
                }
                map[key][as] = key;
                context.stack.head = map[key];
                chunk.render(bodies.block, context);
            }
        });
        context.stack.head = old;

        return chunk;

    };

};
