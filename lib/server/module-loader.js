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
const glob = require('glob'),
    SUtils = require('../utils'),
    SCli = require('../utils/cli'),
    Generator = require('../generator'),
    fs = require('fs'),
    __MODULE_NAME = 'lackey-cms/lib/server/module-loader';

let loadedModules = {},
    config;

let registerModule = (name, server, moduleConfig, path) => {
    return new Promise((resolve) => {
        moduleConfig.path = path;
        loadedModules[name] = moduleConfig;
        // check for init scripts
        if (fs.existsSync(path + '/index.js')) {
            let mod = require(path)(server);
            if (mod && mod.then) {
                return mod.then(() => {
                    resolve();
                });
            }
        }
        resolve();
    }).then(() => {
        SCli.debug(__MODULE_NAME, 'Registered module ' + name);
        return moduleConfig;
    });
};

let readModule = (name, server) => {

    if (loadedModules[name]) {
        SCli.debug(__MODULE_NAME, 'Module cached ' + name);
        return loadedModules[name];
    }

    let path, promise, configPath;

    if (name.startsWith('cms/')) {
        path = SUtils.getLackeyPath() + 'modules/' + name.replace(/^cms\//, '');
    } else {
        path = SUtils.getProjectPath() + 'sites/' + config.get('site') + '/modules/' + name;
    }

    if (!fs.lstatSync(path).isDirectory()) {
        SCli.debug(__MODULE_NAME, 'Not a module ' + name);
        return Promise.resolve(null);
    }

    SCli.debug(__MODULE_NAME, 'Reading module ' + name);

    configPath = path + '/module.yml';

    promise = SUtils.fs.stats(configPath)
        .then((stats) => {
            if (stats && stats.isFile()) {
                return Generator.load(configPath).then((cfg) => {
                    SCli.debug(__MODULE_NAME, 'Config loaded for module ' + name);
                    return cfg;
                });
            }
            SCli.debug(__MODULE_NAME, 'No config for module ' + name);
            return {};
        })
        .then((cfg) => {

            SCli.debug(__MODULE_NAME, 'Processing config for ' + name);

            let moduleConfig = cfg || {};

            if (moduleConfig.require && moduleConfig.require.length) {
                return SUtils.serialPromise(moduleConfig.require, (dependency) => {
                    return readModule(dependency, server);
                }).then(() => {
                    return moduleConfig;
                });
            }
            return moduleConfig;
        })
        .then((cfg) => {
            SCli.debug(__MODULE_NAME, 'Resolved module ' + name);
            return registerModule(name, server, cfg, path);
        });

    loadedModules[name] = promise;

    return loadedModules[name];

};


let readScope = (pattern, server, isCms) => {

    SCli.debug(__MODULE_NAME, 'Reading scope from ' + pattern);

    return new Promise((resolve, reject) => {

        glob(pattern, (err, list) => {
            SCli.debug(__MODULE_NAME, 'Glob in Reading scope from ' + pattern);
            if (err) {
                /* istanbul ignore next */
                return reject(err);
            }

            SUtils.serialPromise(list, (file) => {
                let name = (isCms ? 'cms/' : '') + file.replace(/^.*\//, '');
                return readModule(name, server);
            }).then(() => {
                SCli.debug(__MODULE_NAME, 'Read scope from ' + pattern);
                resolve();
            });

        });

    });
};

module.exports = (server, configuration) => {
    config = configuration;
    SCli.debug(__MODULE_NAME, 'Step 1');
    return readScope(SUtils.getLackeyPath() + 'modules/*', server, true)
        .then(() => {
            SCli.debug(__MODULE_NAME, 'Step 2');
            return readScope(SUtils.getProjectPath() + 'sites/' + config.get('site') + '/modules/*', server);
        })
        .then(() => {
            SCli.debug(__MODULE_NAME, 'Step 3');
        });

};

module.exports.list = () => {
    return Object.keys(loadedModules);
};

module.exports.loadModels = (name) => {
    SCli.debug(__MODULE_NAME, 'Loading models from ' + name);

    return new Promise((resolve, reject) => {

            let path = loadedModules[name].path;

            glob(path + '/server/models/*', (err, list) => {

                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }

                return SUtils.serialPromise(list, (file) => {
                    SCli.debug(__MODULE_NAME, 'Loading model ' + file + ' for ' + name);
                    return require(file);
                }).then(resolve, reject);
            });

        })
        .then(() => {
            if (loadedModules[name].init) {
                SCli.debug(__MODULE_NAME, 'Loading init data for module ' + name);
                return Generator.processInitData(loadedModules[name].init)
                    .then(() => {
                        SCli.debug(__MODULE_NAME, 'Finished Loading init data for module ' + name);
                        return true;
                    });
            }
            return true;
        });
};

module.exports.loadRoutes = (name, express, falcorRoutes) => {

    return new Promise((resolve, reject) => {

        let path = loadedModules[name].path;
        SCli.debug(__MODULE_NAME, 'Loading routes for ' + name + ' in ' + path + '/server/routes/*');

        glob(path + '/server/routes/*', (err, list) => {

            if (err) {
                /* istanbul ignore next */
                return reject(err);
            }

            Promise.all(list.map((file) => {
                SCli.debug(__MODULE_NAME, 'Loading route ' + file + ' for ' + name);
                return require(file)(express, falcorRoutes);
            })).then(resolve, reject);

        });

    });
};

module.exports.get = (name) => {
    return loadedModules[name];
};
