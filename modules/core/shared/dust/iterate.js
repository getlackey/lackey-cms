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

    dust.helpers.iterate = function (chunk, context, bodies, params) {

        let from = params.from || 0,
            to = params.to || 0,
            as = params.iterator || '$idx';

        if (from <= to) {
            for (var i = from; i <= to; i++) {
                let data = {};
                data[as] = +i;
                chunk = chunk.render(bodies.block, context.push(data));
            }
        }

        return chunk;

    };

    dust.helpers.iter = function (chunk, context, bodies, params) {
        var obj = params.context;
        Object.keys(obj).forEach(function (key) {
           chunk.render(bodies.block, context.push({key: key, value: obj[key]}));
        });
    };

};
