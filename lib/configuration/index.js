/* eslint no-underscore-dangle:0 */
/* jslint esnext:true, node:true */
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

/**
 * @module lackey-cms/configuration
 */
const SCli = require('../utils/cli'),
    SUtils = require('../utils'),
    objectPath = require('object-path'),
    Bindable = require('../utils/bindable'),
    _ = require('lodash'),
    __MODULE_NAME = 'lackey-cms/lib/configuration';

/**
 * @class
 *
 * Manages configuration loading. Configuration is composed from layers, where every next can override previous. Order of loading is:
 *
 * - CMS config for stage (or default, if stage doesn't exists)
 * - Stack config for stage  (or default, if stage doesn't exists)
 * - Site config for stage (or default, if stage doesn't exists)
 */
class Configuration extends Bindable {

    /**
     * @constructs Configuration
     * @param {string} stage - staging environment
     */
    constructor(stage) {
        super();
        this.stage = stage;

        let parentStage = SUtils.fileExistsSync(LACKEY_PATH + '/../config/' + stage + '.js') ? stage : 'default',
            lackeyCFG = require(LACKEY_PATH + '/../config/' + parentStage);

        this._map = _.merge({
            'stage': stage
        }, lackeyCFG);
        SCli.debug(__MODULE_NAME, 'Loaded config in constructor from `' + LACKEY_PATH + 'config/' + stage + '`');
    }

    /**
     * Loads configuration
     * @returns {Promise<Config>}
     */
    load(overrides) {
        return Promise
            .resolve(this._map)
            .then(this.bind(this._resolveConfigs))
            .then(this.bind((config) => {
                this._map = config;
                if (overrides) {
                    this._map = _.merge(this._map, overrides);
                }
                return this;
            }));
    }

    /**
     * Informs is application runs in test mode
     * @returns {Boolean} is in test mode
     */
    isTest() {
        return this._map.isTest || false;
    }

    /**
     * Gets field from configuration. Accept dot notation as defined in https://www.npmjs.com/package/object-path
     * @param   {string} name
     * @returns {mixed|null}
     */
    get(name) {
        return objectPath(this._map).get(name);
    }

    /**
     * Resolve configuration from given path and merge it with given
     * @private
     * @param   {object} config known so far state of config
     * @param   {string} path   to the file
     * @returns {Promise.<object>} merged config
     */
    _resolveConfig(config, path) {

        let cfg = config;

        return SUtils
            .exists(path)
            .then((exists) => {
                if (exists) {
                    SCli.debug(__MODULE_NAME, 'Loading config from `' + path + '`');
                    let foundConfig = require(path);
                    if (foundConfig) {
                        cfg = _.merge(cfg, foundConfig);
                        SCli.debug(__MODULE_NAME, 'Loaded config from `' + path + '`');
                        return true;
                    }
                } else {
                    SCli.debug(__MODULE_NAME, 'Not config at `' + path + '`');
                }
                return false;
            });
    }

    /**
     * Resolve configuration for given environment folderr
     * @private
     * @param   {object} config  known so far state of config
     * @param   {string} rootDir to scan
     * @returns {Promise.<object>} merged config
     */
    _resolveConfigs(config) {

        let self = this,
            rootDir = SUtils.getProjectPath();


        return self
            ._resolveConfig(config, rootDir + 'config/' + self.stage + '.js')
            .then((found) => {
                if (!found) {
                    return self._resolveConfig(config, rootDir + 'config/default.js');
                }
            }).then(() => {
                return config;
            });
    }

}

let promise;

/**
 * Setups module and overrides it
 * @param {string} site
 * @param {string} stage
 */
module.exports = (stage, overrides) => {

    if (promise) {
        return promise;
    }

    if (!stage) {
        throw new Error('Wrong loading order');
    }
    let config = new Configuration(stage);
    promise = config.load(overrides);
    return promise;
};

module.exports.unload = () => {
    promise = null;
};
