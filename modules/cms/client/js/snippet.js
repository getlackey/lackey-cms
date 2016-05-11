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

const
    LackeySchema = require('cms/shared/content-blocks').LackeySchema,
    format = require('prosemirror/dist/format'),
    toText = format.toText,
    parseFrom = format.parseFrom;


module.exports = (dust) => {

    dust.helpers.snippet = function (chunk, context, bodies, params) {
        let source = params.source || {
                'type': 'doc'
            },
            limit = params.limit || 100,
            text = toText(parseFrom(LackeySchema, source, 'json')).substring(0, limit);
        return chunk.write(text);

    };

};
