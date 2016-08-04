/* jslint node:true, esnext:true */
/* global LACKEY_PATH */
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
    algorithm = 'aes256',
    base = require(LACKEY_PATH + '/../modules/cms/server/lib/dust/base').base;

module.exports = (dust, config) => {
    dust.filters.analytics = (value) => module.exports.makeLink(config.get('host'), value);

    function renderBlock(block, chunk, context) {
        var output = '';
        chunk.tap(function (data) {
            output += data;
            return '';
        }).render(block, context).untap();
        return output;
    }

    dust.helpers.analytics = (chunk, context, bodies) => {
        let content = renderBlock(bodies.block, chunk, context);
        chunk.write(module.exports.makeLink(config.get('host'), content));
    };

};

module.exports.makeLink = function (host, value) {
    // http://stackoverflow.com/a/6953606/2802756
    // for now we'd use host as salt, let's not be too fussy about it yet
    let encoded = module.exports.encode(value, host);
    return base(host, '/stat/redirect/' + encoded);


};

module.exports.encode = function (value, salt) {
    let cipher = crypto
        .createCipher(algorithm, salt);
    return cipher.update(value, 'utf8', 'hex') + cipher.final('hex');
};

module.exports.decode = function (value, salt) {
    let decipher = crypto.createDecipher(algorithm, salt);
    return decipher.update(value, 'hex', 'utf8') + decipher.final('utf8');
};
