/* eslint no-underscore-dangle:0, no-use-before-define:0 */
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
/**
 * @module lackey-cms/generator
 */
const
    YAML = require('js-yaml'),
    SCli = require('../utils/cli'),
    SUtils = require('../utils'),
    path = require('path'),
    __MODULE_NAME = 'lackey-cms/lib/generator';

let
    yaml,
    currentFile,
    importType = new YAML.Type('!import', {
        kind: 'scalar',
        resolve: function () {
            return true;
        },

        // If a node is resolved, use it to create a Point instance.
        construct: function (data) {
            let result = [],
                dir = path.dirname(currentFile);
            data.split(/\s+/).forEach((file) => {
                result = result.concat(load(path.join(dir, file)));
            });
            return result;
        }

    }),
    mappers = {},
    overrides = null;

function log() {
    SCli.debug.apply(SCli, [__MODULE_NAME].concat(Array.prototype.slice.apply(arguments)));
}

yaml = YAML.Schema.create([require('js-yaml/lib/js-yaml/schema/json')], [importType]);

function load(filePath) {
    try {
        let document = SUtils.readSync(filePath, 'utf8'),
            oldPath = currentFile,
            doc;
        currentFile = filePath;
        doc = YAML.safeLoad(document, {
            schema: yaml
        });
        currentFile = oldPath;
        return doc;
    } catch (e) {
        throw new Error(filePath, e);
    }

}

class Generator {

    static override(type) {

        if (!overrides) {
            return false;
        }
        if (overrides === '*') {
            return true;
        }
        return (overrides.indexOf(type) !== -1);
    }

    static load(filePath, init) {

        log('Loading module YAML', filePath, init ? 'init' : 'no init');

        return new Promise((resolve, reject) => {
                try {
                    resolve(load(filePath));
                } catch (error) {
                    reject(error);
                }
            })
            .then(document => {
                if (!init) {
                    return document;
                }
                if (document && document.init) {
                    SCli.debug(__MODULE_NAME, 'Will init ', filePath);
                    return Generator.processInitData(document.init);
                }
                return document;
            });
    }

    static map(key, object, config) {
        if (!object) {
            return null;
        }
        if (object.stages && object.stages.indexOf(config.get('stage')) === -1) {
            log('Ignoring', key, object.name ? object.name : object, ' because `' + config.get('stage') + '` is not in `', object.stages.join('`, `') + '`');
            return null;
        }
        log('Mapping', key, object.name ? object.name : object);
        return mappers[key](object);
    }

    static processInitData(initData) {

        return require('../configuration')()
            .then((config) => {
                log('Mapping created promises');

                overrides = config.get('yml.override');

                return SUtils
                    .serialPromise(Object.keys(initData), (key) => {

                        log('Found ' + initData[key].length + ' entries for ' + key);

                        if (!mappers[key]) {
                            log('Mapper not defined for ', key);
                            return null;
                        }
                        return SUtils
                            .serialPromise(initData[key], (object) => Generator.map(key, object, config));
                    }, true);
            })
            .then((data) => {
                log('Finished');
                return data;
            });

    }
    static registerMapper(type, mapper) {
        log('Setting mapper for', type);
        mappers[type] = mapper;
    }

    static cleanup() {
        let mappers = {};
        let overrides = null;
    }
}

module.exports = Generator;
