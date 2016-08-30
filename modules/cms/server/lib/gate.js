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

const
    crypto = require('crypto'),
    DEFAULT_SALT = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64').toString('base64'),
    algorithm = 'aes256';

module.exports.generateLink = function (inputSalt, type, id) {
    let
        salt = inputSalt ? new Buffer(inputSalt.toString('base64'), 'base64').toString('base64') : DEFAULT_SALT,
        text = {
            type: type,
            id: id
        },
        cipher = crypto.createCipher(algorithm, salt), // todo - think about better way
        token = cipher.update(JSON.stringify(text), 'utf8', 'hex') + cipher.final('hex');
    return 'download/' + token;
};

module.exports.decipherToken = function (inputSalt, token) {
    let
        salt = inputSalt ? new Buffer(inputSalt.toString('base64'), 'base64').toString('base64') : DEFAULT_SALT,
        decipher = crypto.createDecipher(algorithm, salt);
    return JSON.parse(decipher.update(token, 'hex', 'utf8') + decipher.final('utf8'));
};
