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

const SUtils = require(LACKEY_PATH).utils;
//Translation = require('../../controllers/translation');


module.exports = (dust) => {

    function renderBlock(block, chunk, context) {
        var output = '';
        chunk.tap(function (data) {
            output += data;
            return '';
        }).render(block, context).untap();
        return output;
    }

    dust.helpers.translate = function (chunk, context, bodies, params) {
        let content = renderBlock(bodies.block, chunk, context),
            ref = params.ref,
            locale = context.get('locale');

        return chunk.map((injected) => {
            return SUtils.cmsMod('core').model('translation')
                .then((Translation) => {
                    return Translation.getTranslation(ref, locale, content);
                }).then((model) => {
                    if (model && model._doc.value) {
                        injected.write(model._doc.value);
                        injected.end();
                    } else {
                        injected.write(content);
                        injected.end();
                    }
                }, (error) => {
                    console.error(error);
                });
        });
    };

};
