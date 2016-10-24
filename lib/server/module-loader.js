/* jslint node:true, esnext:true, no-use-before-define */
/* eslint no-use-before-define:0 */
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
const
    SUtils = require('../utils'),
    SCli = require('../utils/cli'),
    Generator = require('../generator'),
    __MODULE_NAME = 'lackey-cms/lib/server/module-loader',
    _ = require('lodash'),
    allowedMethods = [
        'get',
        'post',
        'put',
        'delete',
        'options',
        'head',
        'crud'
    ];

let
    loadedModules = {},
    moduleLoaders = {};

/**
 *
 * @param   {string} name
 * @param   {object} server
 * @param   {object} moduleConfig
 * @param   {string} modulePath
 * @returns {Promise}
 */
function registerModule(name, server, moduleConfig, modulePath) {
    moduleConfig.path = modulePath;
    loadedModules[name] = moduleConfig;
    return Promise.resolve(moduleConfig);
}

/**
 * [[Description]]
 * @param   {[[Type]]} cfg    [[Description]]
 * @param   {[[Type]]} name   [[Description]]
 * @param   {[[Type]]} server [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function analyseConfig(cfg, name, server) {

    SCli.debug(__MODULE_NAME, 'ANALYZE CONFIG ' + name);

    let moduleConfig = cfg || {};

    if (moduleConfig.require && moduleConfig.require.length) {
        return SUtils
            .serialPromise(moduleConfig.require, dependency => {
                if (name === dependency) {
                    return Promise.reject('INVALID CONFIG ' + name);
                }
                SCli.debug(__MODULE_NAME, 'REQUIRE ' + name + ' => ' + dependency);
                return readModule(dependency, server)
                    .then(dep => {
                        SCli.debug(__MODULE_NAME, 'RESOLVED ' + name + ' => ' + dependency);
                        return dep;
                    });
            })
            .then(() => {
                return moduleConfig;
            });
    }
    return moduleConfig;

}

/**
 * [[Description]]
 * @param   {[[Type]]} cfg        [[Description]]
 * @param   {[[Type]]} name       [[Description]]
 * @param   {[[Type]]} server     [[Description]]
 * @param   {[[Type]]} modulePath [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function processInitScripts(cfg, name, server, modulePath) {
    SCli.debug(__MODULE_NAME, 'CHECK FOR INIT SCRIPT ' + name);
    return SUtils
        .exists(modulePath + '/index.js')
        .then(exists => {

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
}

/**
 * [[Description]]
 * @param   {string}   name   [[Description]]
 * @param   {[[Type]]} server [[Description]]
 * @returns {Promise}   [[Description]]
 */
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

    let modulePath;

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

    let configPath = modulePath + '/module.yml';

    moduleLoaders[name] = SUtils
        .exists(configPath)
        .then(exists => {
            if (exists) {
                SCli.debug(__MODULE_NAME, 'LOADEDING CONFIG ' + name);
                return Generator
                    .load(configPath)
                    .then(cfg => {
                        SCli.debug(__MODULE_NAME, 'CONFIG LOADED ' + name);
                        return cfg;
                    });
            }
            SCli.debug(__MODULE_NAME, 'NO CONFIG ' + name);
            return {};
        })
        .then(cfg => analyseConfig(cfg, name, server))
        .then(cfg => processInitScripts(cfg, name, server, modulePath))
        .catch(e => console.error(e));

    return moduleLoaders[name];

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
        .then(alist => {

            SCli.debug(__MODULE_NAME, 'Glob in Reading scope from ' + pattern);

            return SUtils
                .serialPromise(alist, file => {
                    let name = (isLackey ? 'cms/' : '') + file.replace(/^.*\//, '');
                    return readModule(name, server);
                });
        });
}

/**
 * [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function list() {

    return Object.keys(loadedModules);
}

/**
 * [[Description]]
 * @param   {[[Type]]} name [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function loadModels(name) {

    SCli.debug(__MODULE_NAME, 'Loading models from ' + name);

    return SUtils
        .glob(loadedModules[name].path + '/server/models/*')
        .then(alist => {

            SCli.debug(__MODULE_NAME, 'Loading models' + list);

            return SUtils
                .serialPromise(alist, file => {
                    SCli.debug(__MODULE_NAME, 'Loading model ' + file + ' for ' + name);
                    return require(file);
                });
        });
}

/**
 * [[Description]]
 * @param   {[[Type]]} name [[Description]]
 * @returns {boolean}  [[Description]]
 */
function loadInitData(name) {

    SCli.debug(__MODULE_NAME, 'Loading data from ' + name);

    return Generator
        .processInitData(loadedModules[name].init || {})
        .then(() => {
            SCli.debug(__MODULE_NAME, 'Finished Loading init data for module ' + name);
            return true;
        });
}

/**
 * [[Description]]
 * @param   {string} dependency [[Description]]
 * @returns {object} [[Description]]
 */
function analyseDependency(dependency) {

    let
        sections = dependency.split('/'),
        stack = sections.shift(),
        module = sections.shift(),
        dependencyPath = sections.join('/'),
        dependencyPair = dependencyPath.split('#'),
        dependencyName = dependencyPair[0],
        dependencyMethod = dependencyPair[1] || null;

    return {
        stack: stack,
        module: module,
        path: dependencyName,
        method: dependencyMethod
    };
}

/**
 * [[Description]]
 * @param   {[[Type]]} dependency [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function fetchDependency(dependency) {

    SCli.debug(__MODULE_NAME, 'fetchDependency', dependency);

    let addresses = analyseDependency(dependency);

    return SUtils[addresses.stack === 'cms' ? 'cmsMod' : 'mod'](addresses.module)
        .path(addresses.path)
        .then(dependencyObject => {

            addresses.object = dependencyObject;

            if (addresses.method !== null) {
                addresses.result = dependencyObject[addresses.method];
            } else {
                addresses.result = dependencyObject;
            }

            return addresses;
        });
}

/**
 * [[Description]]
 * @param   {[[Type]]} dependency [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function retrieveDependency(dependency) {

    return fetchDependency(dependency)
        .then(result => result.result);
}

/**
 * [[Description]]
 * @param   {[[Type]]} dependency [[Description]]
 * @param   {[[Type]]} args       [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function callDependency(dependency, args) {

    SCli.debug(__MODULE_NAME, 'callDependency', dependency);

    return fetchDependency(dependency)
        .then(result => {
            SCli.debug(__MODULE_NAME, 'callDependency', args.map(arg => typeof arg));
            return result.result.apply(result.object, args);
        });
}

/**
 * [[Description]]
 * @param   {[[Type]]} injections [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function loadInjections(injections) {
    SCli.debug(__MODULE_NAME, 'loadInjections', injections);
    return Promise
        .all((injections || [])
            .map(dependency => {
                if (dependency === 'configuration') {
                    return require(LACKEY_PATH + '/configuration')();
                }
                if (dependency === 'mailer') {
                    return require(LACKEY_PATH + '/mailer');
                }
                return retrieveDependency(dependency);
            }));
}

/**
 * [[Description]]
 * @param   {[[Type]]} route   [[Description]]
 * @param   {object}   options [[Description]]
 * @param   {[[Type]]} express [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function setupCRUD(route, options, express) {

    let
        fieldName = options.field + 'Id',
        fieldRoute = route + '/:' + fieldName;

    return Promise
        .all([
            // GET list
            setupYAMLRoute(route, 'get', _.merge({
                controller: options.controller + '#list'
            }, options.options), express),
            // POST create
            setupYAMLRoute(route, 'post', _.merge({
                controller: options.controller + '#create'
            }, options.options), express),
            // GET read
            setupYAMLRoute(fieldRoute, 'get', _.merge({
                controller: options.controller + '#read'
            }, options.options), express),
            // PUT update
            setupYAMLRoute(fieldRoute, 'put', _.merge({
                controller: options.controller + '#update'
            }, options.options), express),
            // DELETE delete
            setupYAMLRoute(fieldRoute, 'delete', _.merge({
                controller: options.controller + '#delete'
            }, options.options), express),
            // byId
            loadYAMLRouteParam(fieldName, _.merge({
                controller: options.controller + '#byId',
                field: options.field
            }, options.options), express)
        ]);
}

/**
 * [[Description]]
 * @param   {[[Type]]} route   [[Description]]
 * @param   {[[Type]]} method  [[Description]]
 * @param   {object}   options [[Description]]
 * @param   {object}   express [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function setupYAMLRoute(route, method, options, express) {

    if (method === 'crud') {
        return setupCRUD(route, options, express);
    }

    SCli.debug(__MODULE_NAME, 'setupYAMLRoute', method, route);

    return loadInjections(options.inject)
        .then(injections => {

            let
                chain = [route];

            if (options.ACLHelper === 'admin') {
                chain.push(express.aclAdmin);
            } else if (options.ACLHelper === 'user') {
                chain.push(express.acl);
            }

            chain
                .push((req, res, next) => {
                    callDependency(options.controller, injections.concat([req, res, next]))
                        .catch(error => SCli.error(error));
                });
            express[method].apply(express, chain);
        });
}

/**
 * [[Description]]
 * @param   {[[Type]]} route   [[Description]]
 * @param   {[[Type]]} options [[Description]]
 * @param   {[[Type]]} express [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function loadYAMLRoute(route, options, express) {

    SCli.debug(__MODULE_NAME, 'loadYAMLRoute', route);

    return Promise
        .all(Object
            .keys(options)
            .filter(key => allowedMethods.indexOf(key) > -1)
            .map(method => setupYAMLRoute(route, method, options[method], express)));
}

/**
 * [[Description]]
 * @param   {[[Type]]} name    [[Description]]
 * @param   {[[Type]]} express [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function loadYAMLRoutes(name, express) {

    SCli.debug(__MODULE_NAME, 'loadYAMLRoutes ' + name);

    if (loadedModules[name].routes) {
        return Promise
            .all(Object
                .keys(loadedModules[name].routes)
                .map(route => loadYAMLRoute(route, loadedModules[name].routes[route], express)));
    }
    return Promise.resolve(true);
}

/**
 * [[Description]]
 * @param {[[Type]]} param   [[Description]]
 * @param {object}   options [[Description]]
 * @param {[[Type]]} express [[Description]]
 */
function loadYAMLRouteParam(param, options, express) {

    let
        defaultController = Promise.resolve((req, res, next, id) => {
            SCli.debug(__MODULE_NAME, 'loadYAMLRouteParam defaultController', param, id);
            req[options.field] = id;
            next();
        });

    if (options.controller) {
        defaultController = loadInjections(options.inject)
            .then(injections => (req, res, next, id) => callDependency(options.controller, injections.concat([req, res, next, id])));
    }

    express
        .param(param, (req, res, next, id) => {
            defaultController
                .then(handler => handler(req, res, next, id), error => console.error(error));
        });

}

/**
 * [[Description]]
 * @param   {[[Type]]} name    [[Description]]
 * @param   {[[Type]]} express [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function loadYAMLRouteParameters(name, express) {

    SCli.debug(__MODULE_NAME, 'loadYAMLRoutes ' + name);

    if (loadedModules[name].routeParams) {
        return Promise
            .all(Object
                .keys(loadedModules[name].routeParams)
                .map(param => loadYAMLRouteParam(param, loadedModules[name].routeParams[param], express)));
    }
    return Promise.resolve(true);
}

/**
 * [[Description]]
 * @param   {[[Type]]} name         [[Description]]
 * @param   {[[Type]]} express      [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function loadRoutes(name, express, config) {

    SCli.debug(__MODULE_NAME, 'Loading routes for ' + name);

    return SUtils
        .glob(loadedModules[name].path + '/server/routes/*')
        .then(alist => {

            return Promise
                .all(alist
                    .map(file => {
                        SCli.debug(__MODULE_NAME, 'Loading route ' + file + ' for ' + name);
                        return require(file)(express, config);
                    }));
        })
        .then(() => loadYAMLRouteParameters(name, express))
        .then(() => loadYAMLRoutes(name, express))
        .catch(error => console.error(error));
}

/**
 * [[Description]]
 * @param   {[[Type]]} name [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function get(name) {
    return loadedModules[name];
}

/**
 * [[Description]]
 */
function cleanup() {
    loadedModules = {};
    moduleLoaders = {};
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

module.exports = _.merge(module.exports, {
    get: get,
    cleanup: cleanup,
    loadRoutes: loadRoutes,
    list: list,
    loadModels: loadModels,
    loadInitData: loadInitData
});
