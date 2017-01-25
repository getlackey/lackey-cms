/* jslint node:true, esnext:true */
/* globals LACKEY_PATH */
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

const SCli = require(LACKEY_PATH).cli;

module.exports = (dust) => {

    dust.helpers.split = function (chunk, context, bodies, params) {
        SCli.debug('lackey-cms/modules/cms/server/lib/dust/split');

        let key = params.key,
            delim = params.delim;

        return chunk.render(bodies.block, context.push({split: key.split(delim)}));
    };

};
