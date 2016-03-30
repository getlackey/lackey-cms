/* eslint no-underscore-dangle:0, no-process-exit:0 */
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
 * Based on https://github.com/serverless/serverless/blob/master/lib/utils/index.js
 */

require('shelljs/global');

const rawDebug = require('debug'),
    SError = require('../LackeyError'),
    fs = require('fs'),
    BbPromise = require('bluebird'),
    chalk = require('chalk'),
    path = require('path');


/**
 * Execute (Command)
 */
/* istanbul ignore next */
exports.execute = function (promise) {
    promise
        .catch(SError, function (e) {
            console.error(e);
            process.exit(e.messageId);
        })
        .error(function (e) {
            console.error(chalk.red(e));
            process.exit(1);
        })
        .done();
};

/**
 * Get Project Path
 *
 * As in future Lackey could be installed as global npm package AND/OR npm dependency we need to determine current project location.
 *
 * - Returns path string
 */
let projectPath = null;

exports.setProjectPath = (newPath) => {
    projectPath = newPath;
};

exports.getProjectPath = function () {

    if (projectPath) {
        return projectPath;
    }

    let startDir = process.cwd();

    let _this = this;

    // Check if startDir is root
    if (_this.fileExistsSync(path.join(startDir, 'lackey.json'))) {
        return path.resolve(startDir) + '/';
    }

    // Check up to 10 parent levels
    let previous = './',
        projRootPath = false;

    for (let i = 0; i < 10; i++) {
        previous = path.join(previous, '../');
        let fullPath = path.resolve(startDir, previous);

        if (_this.fileExistsSync(path.join(fullPath, 'lackey.json'))) {
            projRootPath = fullPath;
            break;
        }
    }

    projectPath = projRootPath ? (projRootPath + '/') : false;
    return projectPath;
};

exports.fileExistsSync = function (filePath) {
    try {
        let stats = fs.lstatSync(filePath);
        return stats.isFile();
    } catch (e) {
        return false;
    }
};

exports.isTest = function () {
    return typeof global.it === 'function';
};

let lackeyPath = path.resolve(__dirname, '../../');

exports.getLackeyPath = function () {
    return lackeyPath + '/';
};


/**
 * Write to console.log if process.env.DEBUG is true
 * - If we ever want to get more complicated with log levels we should use winston
 */
let debuggerCache = {};
exports.sDebugWithContext = function (inputContext) {
    if (process.env.DEBUG) {
        let context = `lackey:${inputContext}`;
        if (!debuggerCache[context]) {
            debuggerCache[context] = rawDebug(context);
        }
        debuggerCache[context].apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

function getStack() {
    // Save original Error.prepareStackTrace
    let origPrepareStackTrace = Error.prepareStackTrace;

    // Override with function that just returns `stack`
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };

    let err = new Error();

    // Get `err.stack`, which calls our new `Error.prepareStackTrace`
    let stack = err.stack;

    // Restore original `Error.prepareStackTrace`
    Error.prepareStackTrace = origPrepareStackTrace;

    // Remove ourselves from the stack
    stack.shift();

    return stack;
}

function getCaller() {
    let stack = getStack();

    // Remove unwanted function calls on stack -- ourselves and our caller
    stack.shift();
    stack.shift();

    // Now the top of the stack is the CallSite we want
    // See this for available methods:
    //     https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi
    return stack[0].getFileName();
}


function pathToContext(contextPath) {
    // Match files under lib, tests, or bin so we only report the
    // relevant part of the file name as the context
    let pathRegex = /\/((lib|tests|bin)\/.*?)\.js$/i;
    let match = pathRegex.exec(contextPath);
    if (match.length >= 2) {
        return match[1].replace(/[\/\\]/g, '.');
    } else {
        /* istanbul ignore next */
        return contextPath;
    }
}

exports.sDebug = function () {

    if (process.env.DEBUG) {
        let caller = getCaller();
        let context = pathToContext(caller);
        let args = Array.prototype.slice.call(arguments);
        args.unshift(context);
        this.sDebugWithContext.apply(this, args);
    }
};

let loadModule = (moduleName) => {

    return {
        model: (name) => {
            return require(moduleName + '/server/models/' + name);
        },
        policy: (name) => {
            return require(moduleName + '/server/policies/' + name);
        },
        controller: (name) => {
            return require(moduleName + '/server/controllers/' + name);
        }
    };
};

exports.cmsMod = (moduleName) => {
    return loadModule(exports.getLackeyPath() + 'modules/' + moduleName);
};

exports.mod = (site, moduleName) => {
    return loadModule(exports.getProjectPath() + 'sites/' + site + '/modules/' + moduleName);
};

exports.serialPromise = (array, fn, asObject) => {
    let current = BbPromise.cast(),
        results = asObject ? {} : [];
    array.forEach((elem, idx) => {
        current = current.then(() => {
            let next = fn(elem, idx);
            if (!next || !next.then) {
                next = BbPromise.resolve(next);
            }
            return next.then((result) => {
                if (!asObject) {
                    results.push(result);
                } else {
                    results[elem] = result;
                }
            });
        });
    });
    return current.then(() => {
        return results;
    });
};

exports.deps = function () {
    let promise = exports.serialPromise(Array.prototype.slice.call(arguments), (dependency) => dependency);
    return {
        promised: (callback) => {
            return promise.then((list) => {
                return callback.apply(null, list);
            }, (error) => {
                console.error(error);
                console.error(error.stack);
            });
        }
    };
};

exports.fs = {
    stats: (filePath) => {
        return new BbPromise((resolve, reject) => {
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        return resolve(null);
                    }
                    return reject(err);
                }
                return resolve(stats);
            });
        });
    }
};
