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

const dateformat = require('dateformat');

module.exports = (dust) => {

    function format(value, pattern) {
        if (value instanceof Date) {
            return dateformat(value, pattern);
        }
        try {
            return dateformat(new Date(value), pattern);
        } catch (e) {
            console.error(e);
            return value;
        }
    }

    dust.filters.dateTimeFormat = function (value) {
        return format(value);
    };

    dust.filters.day = function (value) {
        return format(value, 'd');
    };

    dust.filters.monthLong = function (value) {
        return format(value, 'mmmm');
    };

    dust.filters.year = function (value) {
        return format(value, 'yyyy');
    };
};
