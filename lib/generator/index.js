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
/**
 * @module lackey-cms/generator
 */
const YAML = require('js-yaml'),
    fs = require('fs'),
    SCli = require('../utils/cli'),
    SUtils = require('../utils'),
    BbPromise = require('bluebird');

let mappers = {};

var overrides = null;

class Generator {
    static override(type) {
        if(!overrides) return false;
        if(overrides === '*') return true;
        return (overrides.indexOf(type) !== -1);
    }
    static load(filePath, init) {

        SCli.debug('lackey-cms/generator', 'Loading module YAML', filePath, init ? 'init' : 'no init');
        let promise = new BbPromise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (error, document) => {
                if (error) {
                    /* istanbul ignore next */
                    return reject(error);
                }
                try {
                    let doc = YAML.safeLoad(document);
                    resolve(doc);
                } catch (exception) {
                    /* istanbul ignore next */
                    reject(exception);
                }
            });
        });
        if (!init) {
            return promise;
        }
        return promise.then((document) => {
            if (document && document.init) {
                SCli.debug('lackey-cms/generator', 'Will init ', filePath);
                return Generator.processInitData(document.init);
            }
            return document;
        });
    }

    static processInitData(initData) {

        return require('../configuration')().then((config) => {
            SCli.debug('lackey-cms/generator', 'Mappging created promises');

            overrides = config.get('yml.override');

            return SUtils.serialPromise(Object.keys(initData), (key) => {

                    SCli.debug('lackey-cms/generator', 'Mapping ', key, ' with ' + initData[key].length + ' entries');

                    if (!mappers[key]) {
                        SCli.debug('lackey-cms/generator', 'Mapper not defined for ', key);
                        return null;
                    }
                    return SUtils.serialPromise(initData[key], (object) => {
                        SCli.debug('lackey-cms/generator', 'Mappging ', key, object);
                        if (object.stages && object.stages.indexOf(config.get('stage')) === -1) {
                            SCli.debug('lackey-cms/generator', 'Ignoring object because ' + config.get('stage') + ' is not in ', object.stages);
                            return null;
                        }
                        return mappers[key](object);
                    });
                }, true)
                .then((data) => {
                    SCli.debug('lackey-cms/generator', 'Finished');
                    return data;
                });
        });
    }
    static registerMapper(type, mapper) {
        SCli.debug('lackey-cms/generator', 'Setting mapper for', type);
        mappers[type] = mapper;
    }
}

module.exports = Generator;
