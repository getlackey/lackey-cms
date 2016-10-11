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

    dust.helpers.error = function (chunk, context, bodies, params) {
        try {
            if ((context.get && context.get('edit')) || context.edit) {
                chunk.write('<div data-lky-error>');
                chunk.write('<h1>' + (params ? params.name : 'Error') + '</h1>');
                chunk.write('<pre>');
                chunk.write(((params && params.stack) ? params.stack : '') + '\n' + JSON.stringify(context, null, 4));
                chunk.write('</pre>');
                chunk.write('</div>');
            } else {
                chunk.end();
            }
        } catch(e) {
            console.error(e);
        }
    };

};
