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
 * @param   {string} name
 * @param   {object} server
 * @param   {object}   moduleConfig
 * @param   {string} modulePath
 * @returns {Promise}
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
        })
        .then(a => {
            return a;
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

const allowedMethods = [
    'get',
    'post',
    'put',
    'delete',
    'options',
    'head'
];

function loadInjections(injections) {
    SCli.debug(__MODULE_NAME, 'loadInjections', injections);
    return Promise
        .all((injections || [])
            .map(depenency => {

                if(depenency === 'configuration') {
                    return require(LACKEY_PATH + '/configuration')();
                }

                let dependencyPath = depenency.split('/'),
                    stack = dependencyPath.shift(),
                    module = dependencyPath.shift(),
                    path = dependencyPath.join('/');
                SCli.debug(__MODULE_NAME, 'loadInjections', stack, module, path);
                return SUtils[stack === 'cms' ? 'cmsMod' : 'mod'](module)
                    .path(path);
            }));
}

function setupYAMLRoute(route, method, options, express) {
    SCli.debug(__MODULE_NAME, 'setupYAMLRoute', method, route);
    let controllerPath = options.controller.split('/'),
        stack = controllerPath.shift(),
        module = controllerPath.shift(),
        controllerPair = controllerPath[0].split('#'),
        controllerName = controllerPair[0],
        controllerMethod = controllerPair[1],
        controller;
    SCli.debug(__MODULE_NAME, 'setupYAMLRoute', stack, module, controllerName);
    return SUtils[stack === 'cms' ? 'cmsMod' : 'mod'](module)
        .controller(controllerName)
        .then(ctrl => {
            controller = ctrl;
            return loadInjections(options.inject);
        })
        .then(injections => {
            let chain = [route];
            if (options.ACLHelper === 'admin') {
                chain.push(express.aclAdmin);
            } else if (options.ACLHelper === 'user') {
                chain.push(express.acl);
            }
            chain.push((req, res, next) => {
                let args = injections.concat([req, res, next]);
                controller[controllerMethod].apply(controller, args);
            });
            express[method].apply(express, chain);
        });
}

function loadYAMLRoute(route, options, express) {
    SCli.debug(__MODULE_NAME, 'loadYAMLRoute', route);
    return Promise.all(Object
        .keys(options)
        .filter(key => allowedMethods.indexOf(key) > -1)
        .map(method => setupYAMLRoute(route, method, options[method], express)));
}

function loadYAMLRoutes(name, express) {
    SCli.debug(__MODULE_NAME, 'loadYAMLRoutes ' + name);
    if (loadedModules[name].routes) {
        return Promise.all(Object
            .keys(loadedModules[name].routes)
            .map(route => loadYAMLRoute(route, loadedModules[name].routes[route], express)));
    }
    return Promise.resolve(true);
}

function loadYAMLRouteParam(param, options, express) {
    if (options.field) {
        express.param(param, (req, res, next, id) => {
            req[options.field] = id;
            next();
        });
        return Promise.resolve();
    }
    return Promise.reject('Controllers not supported yet');
}

function loadYAMLRouteParameters(name, express) {
    SCli.debug(__MODULE_NAME, 'loadYAMLRoutes ' + name);
    if (loadedModules[name].routeParams) {
        return Promise.all(Object
            .keys(loadedModules[name].routeParams)
            .map(param => loadYAMLRouteParam(param, loadedModules[name].routeParams[param], express)));
    }
    return Promise.resolve(true);
}

module.exports.loadRoutes = (name, express, falcorRoutes) => {

    SCli.debug(__MODULE_NAME, 'Loading routes for ' + name);

    return SUtils
        .glob(loadedModules[name].path + '/server/routes/*')
        .then((list) => {

            return Promise.all(list.map((file) => {
                SCli.debug(__MODULE_NAME, 'Loading route ' + file + ' for ' + name);
                return require(file)(express, falcorRoutes);
            }));
        })
        .then(() => loadYAMLRouteParameters(name, express))
        .then(() => loadYAMLRoutes(name, express));
};

module.exports.get = (name) => {
    return loadedModules[name];
};

module.exports.cleanup = () => {
    loadedModules = {};
    moduleLoaders = {};
};
