/* eslint no-underscore-dangle:0, no-param-reassign:0 */
/* jslint node:true, esnext:true */
/* globals LACKEY_PATH */
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
let
    SCli = require('../../utils/cli'),
    SUtils = require('../../utils'),
    View = require('express/lib/view'),
    muleinthedust = require('muleinthedust'),
    path = require('path');

module.exports = (server, config) => {

    SCli.debug('lackey-cms/server/init/views', 'Setting up');

    /*let
        instance = require(LACKEY_PATH).server.instance;

    /*
    if (instance) {
        instance._dustHelpers.forEach((helper) => {
            helper(dust.dust, config);
        });
    }
    */

    server.engine('dust', muleinthedust({
        pathResolver: filePath => Promise.resolve(module.exports.lookupPath(filePath, '.dust'))
    }));

    server.set('view engine', 'dust');
    server.disable('view cache');
};

module.exports.lookupPath = (inputPath, appendExt) => {

    console.log('lookupPath', inputPath, appendExt);

    let
        parts = inputPath.split('/'),
        stack = parts.shift(),
        stackPath = stack === 'cms' ? LACKEY_PATH : SUtils.getProjectPath(),
        module = parts.shift(),
        filePath = parts.join('/'),
        fileServerPath = path.resolve(stackPath + '/modules/' + module + '/server/views/' + filePath),
        fileSharedPath = path.resolve(stackPath + '/modules/' + module + '/shared/views/' + filePath);

    if(appendExt && path.extname(inputPath) !== appendExt) {
        fileServerPath += appendExt;
        fileSharedPath += appendExt;
    }

    if (stack !== '~' && stack !== 'cms') {
        console.log('lookupPath', '>', inputPath);
        return inputPath;
    }

    if (SUtils.fileExistsSync(fileServerPath)) {

        console.log('lookupPath', '>', fileServerPath);
        return fileServerPath;
    }
    console.log('lookupPath', '>', fileSharedPath);
    return fileSharedPath;
};
