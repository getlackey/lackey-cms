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

let Template;

module.exports = (data) => {

    let path;

    return require('./index')
        .then((template) => {
            Template = template;
            if (typeof data === 'number') {
                return Template.findById(data);
            }
            path = (typeof data === 'string') ? data : data.path;
            SCli.debug('lackey/modules/cms/server/models/template/generator', 'Ensure that Template ' + path + ' exists');
            return Template.getByPath(path).then((templateObj) => {
                let wrapped = (typeof data === 'string') ? {
                    path: data
                } : data;
                if (!templateObj) {
                    SCli.log('lackey/modules/cms/server/models/template/generator', 'Create Template ' + path);
                    return Template.create(wrapped);
                }
                if (Generator.override('Template') && templateObj.diff(wrapped)) {
                    return templateObj.save();
                }
                return templateObj;
            });
        }).then((template) => {
            SCli.debug('lackey/modules/cms/server/models/template/generator', 'Ensured that Template ' + JSON.stringify(data) + ' exists');
            return template;
        });
};

Generator.registerMapper('Template', module.exports);
