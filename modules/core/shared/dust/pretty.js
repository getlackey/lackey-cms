/* jslint node:true, esnext:true  */
/* eslint no-param-reassign:0, curly:0, eqeqeq:0 */
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

function censor(censorObj) {
    var i = 0;

    return function (key, value) {
        if (i !== 0 && typeof (censorObj) === 'object' && typeof (value) == 'object' && censorObj == value)
            return '[Circular]';

        if (i >= 29) // seems to be a harded maximum of 30 serialized objects?
            return '[Unknown]';

        ++i; // so we know we aren't using the original object anymore

        return value;
    };
}

module.exports = (dust) => {

    dust.filters.pretty = function (value) {
        try {
            return JSON.stringify(value, censor(value), 4);
        } catch (e) {
            console.log(value);
            return e.toString();
        }
    };
};
