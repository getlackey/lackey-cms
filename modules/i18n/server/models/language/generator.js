/* eslint no-underscore-dangle:0 */
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
if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const SCli = require(LACKEY_PATH).cli,
    Generator = require(LACKEY_PATH).generator;

module.exports = (data, Language) => {

    let LanguageModel = Language || require('./index');

    return LanguageModel.then((language) => {
        LanguageModel = language;

        if (typeof data === 'string') {
            SCli.debug('lackey/modules/i18n/server/models/language/generator', 'Gets language ' + data + ' by code');
            return LanguageModel.getByCode(data);
        }

        SCli.debug('lackey/modules/i18n/server/models/language/generator', 'Ensure that language ' + data.code + ' exists');
        return LanguageModel.getByCode(data.code);
    }).then((language) => {
        if (!language) {
            return LanguageModel.create(data);
        }
        if (language.diff(data)) {
            return language.save();
        }
        return language;
    }).then((language) => {
        SCli.debug('lackey/modules/i18n/server/models/language/generator', 'Ensured that language ' + data.code + ' exists');
        return language;
    });
};

Generator.registerMapper('Language', module.exports);
