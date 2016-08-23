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

    dust.helpers.qs = function (chunk, context, bodies, params) {
        let except = (params.except) ? params.except.split(',') : [],
            method = params.method || 'GET',
            query = (method === 'POST') ? context.get('post') : context.get('req.query'),
            final = '';

        Object.keys(query).forEach((key) => {
            if (except.indexOf(key) < 0) {
                final = (final === '') ? final + '?' + key + '=' + encodeURIComponent(query[key]) : final + '&' + key + '=' + encodeURIComponent(query[key]);
            }
        });

        return final;
    };
};
