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

const SCli = require(LACKEY_PATH).cli,
    _ = require('lodash'),
    Generator = require(LACKEY_PATH).generator;

let Media;

module.exports = (data) => {
    return require('./index')
        .then((media) => {
            Media = media;
            return Media.mapSource(data);
        })
        .then((sourceResult) => {

            if (!sourceResult || !sourceResult.source) {
                return Promise.resolve(null);
            }

            SCli.debug('lackey/modules/media/server/models/media/generator', 'Ensure that media ' + sourceResult.source + ' exists');

            return Media
                .lookupMime(sourceResult.source, sourceResult.mime)
                .then(() => {
                    return Media.findByType(sourceResult.source);
                }).then((media) => {
                    if (!media) {
                        SCli.debug('lackey/modules/media/server/models/media/generator', 'Creating media ' + sourceResult.source);
                        return Media.create(_.merge({
                                attributes: data.attributes || {},
                                name: data.name || sourceResult.source
                            },
                            sourceResult));
                    }

                    if (Generator.override('Media') && media.diff(data)) {
                        return media.save();
                    }
                    return media;
                });
        })
        .then((media) => {
            SCli.debug('lackey/modules/media/server/models/media/generator', 'Ensured that media ' +
                JSON.stringify(data) + ' exists');
            return media;
        });
};

Generator.registerMapper('Media', module.exports);
