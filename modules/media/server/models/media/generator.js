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
    Generator = require(LACKEY_PATH).generator,
    BbPromise = require('bluebird');

let Media;

module.exports = (data) => {
    let path;
    return require('./index')
        .then((media) => {
            Media = media;

            path = Media.defaultSource(data);

            if (!path) {
                return BbPromise.resolve(null);
            }

            SCli.debug('lackey/modules/media/server/models/media/generator', 'Ensure that media ' + path.src + ' exists');
            return Media.findByPath(path.src);
        }).then((media) => {
            if (!media) {
                return Media.create(typeof data === 'string' ? {
                    source: data
                } : data);
            }
            if (Generator.override('Media') && media.diff(data)) {
                return media.save();
            }
            return media;
        }).then((media) => {
            SCli.debug('lackey/modules/media/server/models/media/generator', 'Ensured that media ' + path.src + ' exists');
            return media;
        });
};

Generator.registerMapper('Media', module.exports);
