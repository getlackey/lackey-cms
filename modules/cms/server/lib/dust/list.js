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
if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const _ = require('lodash'),
    SCli = require(LACKEY_PATH).cli,
    SUtils = require(LACKEY_PATH).utils,
    treeParser = require('../../../shared/treeparser'),
    block = require('./block');

module.exports = (dust) => {

    dust.helpers.list = function (chunk, context, bodies, params) {
        SCli.debug('lackey-cms/modules/cms/server/lib/dust/block');

        return chunk.map((injectedChunk) => {

            SUtils.serialPromise(treeParser.get(params.content.layout, params.path, params.field || false).items, (item, idx) => {
                let innerParams = _.merge({}, params, {
                    path: (params.path ? (params.path + '.') : '') + 'items.' + idx,
                    parent: params.path
                });
                return block.block(item, injectedChunk, context, bodies, innerParams, dust, params.content.id);
            }).then(() => {
                injectedChunk.end();
            }, (error) => {
                dust.helpers.error(injectedChunk, error);
                console.log(error, error.stack);
                injectedChunk.end();
            });
        });
    };

};
