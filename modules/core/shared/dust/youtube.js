/* jslint node:true */
/* THIS ONE HAS TO BE ES5!!! */
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

var
    isYoutube,
    isVimeo;

if (typeof window === 'undefined') {
    isYoutube = require('../../../cms/shared/youtube');
    isVimeo = require('../../../cms/shared/vimeo');

} else {
    isYoutube = require('cms/shared/youtube');
    isVimeo = require('cms/shared/vimeo');
}


module.exports = function (dust) {

    dust.helpers.youtube = function (chunk, context, bodies, params) {

        var
            path = params.path,
            youtube = isYoutube(path),
            type = params.type || '';

        if (youtube) {
            if (type === 'image') {
                chunk = chunk.render(bodies.block, context.push('https://img.youtube.com/vi/' + youtube + '/default.jpg'));
            } else {
                chunk = chunk.render(bodies.block, context.push(youtube));
            }
        } else {
            chunk = chunk.render(bodies.else, context);
        }

        return chunk;


    };

    dust.helpers.vimeo = function (chunk, context, bodies, params) {

        var
            path = params.path,
            vimeo = isVimeo(path);

        if (vimeo) {
            chunk = chunk.render(bodies.block, context.push(vimeo));
        } else {
            chunk = chunk.render(bodies.else, context);
        }

        return chunk;


    };
};
