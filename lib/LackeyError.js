/* jslint esnext:true, node:true */
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

/**
 * @module lackey-cms/LackeyError
 */

/**
 * Lackey Error
 *
 * Ex:
 * SError = require('./LackeyError');
 * throw new SError('OOPS', SError.errorCodes.UNKNOWN);
 */

let LackeyError = class LackeyError extends Error {
    constructor(message, messageId) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        this.messageId = messageId;
        Error.captureStackTrace(this, this.constructor.name);
    }
};

module.exports = LackeyError;

module.exports.errorCodes = {
    UNKNOWN: 1
};
