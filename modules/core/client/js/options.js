/* jslint node:true */
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

function copy(object) {
    return JSON.parse(JSON.stringify(object));
}

function merge() {
    var args = [].slice.apply(arguments),
        target = args.shift();

    args.forEach(function (input) {
        Object.keys(input).forEach(function (key) {
            target[key] = input[key];
        });
    });
    return target;
}

function Options(object, options) {
    return merge(copy(object.constructor.defaultOptions) || {}, options);


}

module.exports = Options;
