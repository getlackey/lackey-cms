/* jslint node:true, esnext:true */
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
    dust.helpers.sort = function (chunk, context, bodies, params) {
        params.items.sort(function (a, b) {
            if (params.by) {
                return ((a[params.by] < b[params.by]) ? -1 : ((a[params.by] > b[params.by]) ? 1 : 0));
            } else {
                return ((a < b) ? -1 : ((a > b) ? 1 : 0));
            }
        });
        params.items.forEach(function (item) {
            chunk.render(bodies.block, context.push(item));
        });
        return chunk;
    };
};
