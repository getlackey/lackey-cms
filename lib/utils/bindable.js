/* eslint no-underscore-dangle:0, no-process-exit:0 */
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

const SUtils = require('./index');

/**
 * @class
 * This is super awesome class that bind context of promise, arrize arguments and more
 */
class Bindable {

    /**
     * Bind function to context
     * @param   {function} fn
     * @param   {array|null} args
     * @returns {function}
     */
    bind(fn, args) {
        let self = this;
        return function () {
            let injectedArgs = SUtils.asArr(arguments);
            if (args && args.length) {
                injectedArgs = args.concat(injectedArgs);
            }
            return fn.apply(self, injectedArgs);
        };
    }

}

module.exports = Bindable;
