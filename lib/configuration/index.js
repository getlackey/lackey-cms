/* eslint no-underscore-dangle:0 */
/* jslint esnext:true, node:true */
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
const BbPromise = require('bluebird'),
    SCli = require('../utils/cli'),
    SUtils = require('../utils'),
    fs = require('fs'),
    objectPath = require('object-path'),
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
class Configuration {

    /**
     * @constructs Configuration
     * @param {string} site - website name
     * @param {string} stage - staging environment
     */
    constructor(site, stage) {
        this.site = site;
        this.stage = stage;

        let parentStage = fs.existsSync(SUtils.getLackeyPath() + 'config/' + stage + '.js') ? stage : 'default',
            lackeyCFG = require(SUtils.getLackeyPath() + 'config/' + parentStage);

        this._map = _.merge({
            'site': site,
            'stage': stage
        }, lackeyCFG);
        SCli.debug(__MODULE_NAME, 'Loaded config from `' + SUtils.getLackeyPath() + 'config/' + stage + '`');
    }

    /**
     * Loads configuration
     * @returns {Promise<Config>}
     */
    load() {
        if (this._loadPromise) {
            return this._loadPromise;
        }
        this._loadPromise = BbPromise.resolve(this._map)
            .bind(this)
            .then(this._resolveStackConfig)
            .then(this._resolveSiteConfig)
            .then((config) => {
                this._map = config;
                return this;
            });
        return this._loadPromise;
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
        return new BbPromise((resolve, reject) => {
            let cfg = config;
            fs.exists(path, function (exists) {
                if (exists) {
                    let foundConfig = require(path);
                    if (foundConfig) {
                        cfg = _.merge(cfg, foundConfig);
                        SCli.debug(__MODULE_NAME, 'Loaded config from `' + path + '`');
                        return resolve(cfg);
                    }
                }
                SCli.debug(__MODULE_NAME, 'No stack configuration found in `' + path + '`');
                return reject();
            });
        });
    }

    /**
     * Resolve configuration for given environment folderr
     * @private
     * @param   {object} config  known so far state of config
     * @param   {string} rootDir to scan
     * @returns {Promise.<object>} merged config
     */
    _resolveConfigPair(config, rootDir) {

        let self = this;

        return new BbPromise((resolve) => {
            self._resolveConfig(config, rootDir + 'config/' + self.stage + '.js')
                .then(resolve, () => {
                    self._resolveConfig(config, rootDir + 'config/default.js').then(resolve, () => {
                        resolve(config);
                    });
                });
        });

    }

    /**
     * Resolves stack shared configuration
     * @private
     * @param   {object} config known so far state of config
     * @returns {Promise.<object>} merged config
     */
    _resolveStackConfig(config) {
        return this._resolveConfigPair(config, SUtils.getProjectPath());
    }

    /**
     * Resolves site configuration
     * @private
     * @param   {object} config known so far state of config
     * @returns {Promise.<object>} merged config
     */
    _resolveSiteConfig(config) {
        return this._resolveConfigPair(config, SUtils.getProjectPath() + 'sites/' + this.site + '/');
    }

}

let promise;

/**
 * Setups module and overrides it
 * @param {string} site
 * @param {string} stage
 */
module.exports = (site, stage) => {
    if (promise) {
        return promise;
    }
    promise = new BbPromise((resole, reject) => {
        if (!site || !stage) {
            throw new Error('Wrong loading order');
        }
        let instance = new Configuration(site, stage);
        instance.load().then(resole, reject);
    });
    return promise;
};
