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
const SUtils = require('../utils'),
    SCli = require('../utils/cli'),
    Generator = require('../generator'),
    __MODULE_NAME = 'lackey-cms/lib/server/module-loader';

let loadedModules = {},
    moduleLoaders = {};

/**
 *
 * @param   {[[Type]]} name         [[Description]]
 * @param   {[[Type]]} server       [[Description]]
 * @param   {object}   moduleConfig [[Description]]
 * @param   {[[Type]]} modulePath         [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function registerModule(name, server, moduleConfig, modulePath) {
    moduleConfig.path = modulePath;
    loadedModules[name] = moduleConfig;
    return Promise.resolve(moduleConfig);
}

function readModule(name, server) {

    SCli.debug(__MODULE_NAME, 'READ ' + name);

    if (loadedModules[name]) {
        SCli.debug(__MODULE_NAME, 'FROM CACHE ' + name);
        return Promise.resolve(loadedModules[name]);
    }

    if (moduleLoaders[name]) {
        SCli.debug(__MODULE_NAME, 'FROM QUEUE ' + name);
        return moduleLoaders[name];
    }

    let modulePath, promise, configPath;

    if (name.startsWith('cms/')) {
        modulePath = LACKEY_PATH + '/../modules/' + name.replace(/^cms\//, '');
    } else {
        modulePath = SUtils.getProjectPath() + 'modules/' + name;
    }

    if (!SUtils.fileIsDirSync(modulePath)) {
        SCli.debug(__MODULE_NAME, 'IGNORE' + name);
        return Promise.resolve(null);
    }

    SCli.debug(__MODULE_NAME, 'LOADING ' + name);

    configPath = modulePath + '/module.yml';

    promise = SUtils
        .exists(configPath)
        .then((exists) => {
            if (exists) {
                SCli.debug(__MODULE_NAME, 'LOADEDING CONFIG ' + name);
                return Generator.load(configPath)
                    .then((cfg) => {
                        SCli.debug(__MODULE_NAME, 'CONFIG LOADED ' + name);
                        return cfg;
                    });
            }
            SCli.debug(__MODULE_NAME, 'NO CONFIG ' + name);
            return {};
        })
        .then((cfg) => {

            SCli.debug(__MODULE_NAME, 'ANALYZE CONFIG ' + name);

            let moduleConfig = cfg || {};

            if (moduleConfig.require && moduleConfig.require.length) {
                return SUtils
                    .serialPromise(moduleConfig.require, (dependency) => {
                        if (name === dependency) {
                            return Promise.reject('INVALID CONFIG ' + name);
                        }
                        SCli.debug(__MODULE_NAME, 'REQUIRE ' + name + ' => ' + dependency);
                        return readModule(dependency, server)
                            .then((dep) => {
                                SCli.debug(__MODULE_NAME, 'RESOLVED ' + name + ' => ' + dependency);
                                return dep;
                            });
                    })
                    .then(() => {
                        return moduleConfig;
                    });
            }
            return moduleConfig;
        })
        .then((cfg) => {
            SCli.debug(__MODULE_NAME, 'CHECK FOR INIT SCRIPT ' + name);
            return SUtils.exists(modulePath + '/index.js')
                .then((exists) => {

                    if (exists) {
                        SCli.debug(__MODULE_NAME, 'INIT ' + name);
                        let mod = require(modulePath)(server);
                        if (mod && mod.then) {
                            SCli.debug(__MODULE_NAME, 'INIT DEFERRED ' + name);
                            return mod;
                        }
                    }
                })
                .then(() => {
                    SCli.debug(__MODULE_NAME, 'RESOLVED ' + name);
                    return registerModule(name, server, cfg, modulePath);
                });
        })
        .catch((e) => console.error(e));

    moduleLoaders[name] = promise;
    return promise;

}

/**
 * Search modoule in given scope
 * @param   {string} pattern
 * @param   {Server} server
 * @param   {boolean} isLackey
 * @returns {Promise}
 */
function readScope(pattern, server, isLackey) {

    SCli.debug(__MODULE_NAME, 'Reading scope from ' + pattern);

    return SUtils
        .glob(pattern)
        .then((list) => {

            SCli.debug(__MODULE_NAME, 'Glob in Reading scope from ' + pattern);

            return SUtils
                .serialPromise(list, (file) => {
                    let name = (isLackey ? 'cms/' : '') + file.replace(/^.*\//, '');
                    return readModule(name, server);
                });
        });
}

/**
 * Loads modules
 * @param   {Server} server
 * @returns {Promise}
 */
module.exports = function (server) {

    return readScope(LACKEY_PATH + '/../modules/*', server, true)
        .then(() => {
            return readScope(SUtils.getProjectPath() + 'modules/*', server);
        });
};

module.exports.list = () => {
    return Object.keys(loadedModules);
};

module.exports.loadModels = (name) => {
    SCli.debug(__MODULE_NAME, 'Loading models from ' + name);

    return SUtils
        .glob(loadedModules[name].path + '/server/models/*')
        .then((list) => {
            SCli.debug(__MODULE_NAME, 'Loading models' + list);
            return SUtils
                .serialPromise(list, (file) => {
                    SCli.debug(__MODULE_NAME, 'Loading model ' + file + ' for ' + name);
                    return require(file);
                });
        });
};

module.exports.loadInitData = (name) => {
    SCli.debug(__MODULE_NAME, 'Loading data from ' + name);

    return Generator
        .processInitData(loadedModules[name].init || {})
        .then(() => {
            SCli.debug(__MODULE_NAME, 'Finished Loading init data for module ' + name);
            return true;
        });
};


module.exports.loadRoutes = (name, express, falcorRoutes) => {

    SCli.debug(__MODULE_NAME, 'Loading routes for ' + name);

    return SUtils
        .glob(loadedModules[name].path + '/server/routes/*')
        .then((list) => {

            return Promise.all(list.map((file) => {
                SCli.debug(__MODULE_NAME, 'Loading route ' + file + ' for ' + name);
                return require(file)(express, falcorRoutes);
            }));
        });
};

module.exports.get = (name) => {
    return loadedModules[name];
};
