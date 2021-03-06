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

const _ = require('lodash'),
    SCli = require(LACKEY_PATH).cli,
    SUtils = require(LACKEY_PATH).utils,
    treeParser = require('../../../shared/treeparser'),
    block = require('./block');

module.exports = (dust) => {

    dust.helpers.list = function (chunk, context, bodies, params) {
        SCli.debug('lackey-cms/modules/cms/server/lib/dust/block');

        return chunk.map((injectedChunk) => {

            let
                promise,
                parent = params.parent,
                path = params.path;

            if (parent) {
                path = parent + '.' + path;
            }

            let
                container = treeParser.get(params.content.layout, path, params.field || false);

            if (container && Array.isArray(container.items)) {
                promise = SUtils.serialPromise(container.items, (item, idx) => {
                    let innerParams = _.merge({}, params, {
                        path: (path ? (path + '.') : '') + 'items.' + idx,
                        parent: path
                    });
                    return block.block(item, injectedChunk, context, bodies, innerParams, dust, params.content.id).then(() => {
                        if (bodies.sep && idx < container.items.length - 1) {
                            injectedChunk.render(bodies.sep, context);
                        }
                    });
                });
            } else {
                promise = Promise.resolve();
            }
            promise.then(() => {
                injectedChunk.end();
            }, (error) => {
                dust.helpers.error(injectedChunk, error);
                console.error(error, error.stack);
                injectedChunk.end();
            });
        });
    };

};
