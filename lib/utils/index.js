/* eslint no-underscore-dangle:0, no-process-exit:0 */
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

/**
 * Based on https://github.com/serverless/serverless/blob/master/lib/utils/index.js
 */

const fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    SCli = require('./cli'),
    AWS = require('aws-sdk'),
    __MODULE_NAME = 'lackey-cms/lib/utils';

/**
 * Get Project Path
 *
 * As in future Lackey could be installed as global npm package AND/OR npm dependency we need to determine current project location.
 *
 * - Returns path string
 */
let projectPath = null;

/**
 * @param {string} newPath
 */
exports.setProjectPath = (newPath) => {
    projectPath = newPath;
};

/**
 * Gets project path
 * @returns {string} project root path
 */
exports.getProjectPath = function () {

    if (projectPath) {
        return projectPath;
    }

    let startDir = process.cwd();

    let _this = exports;

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

/**
 * Check if file exists, sync
 * @param   {string} filePath
 * @returns {boolean}
 */
exports.fileExistsSync = function (filePath) {
    try {
        let stats = fs.lstatSync(filePath);
        return stats.isFile();
    } catch (e) {
        return false;
    }
};

/**
 * Check if is dir, sync
 * @param   {string} filePath
 * @returns {boolean}
 */
exports.fileIsDirSync = function (filePath) {
    try {
        let stats = fs.lstatSync(filePath);
        if (stats) {
            return stats.isDirectory();
        } else {
            throw new Error(filePath);
        }
    } catch (e) {
        return false;
    }
};

/**
 * Checks, if it's mocha
 * @returns {boolean}
 */
exports.isTest = function () {
    return typeof global.it === 'function';
};

/**
 * Gives module interface
 * @param   {string} modulePath
 * @returns {object}
 */
exports.moduleInterface = function (modulePath, moduleName) {

    let api = {
        /**
         * Loads module model
         * @param {string} name
         * @return {mixed}
         */
        model: (name) => {
            return api.path('/server/models/' + name);
        },
        /**
         * Loads module policy
         * @param {string} name
         * @return {mixed}
         */
        policy: (name) => {
            return api.path('/server/policies/' + name);
        },
        /**
         * Loads module controller
         * @param {string} name
         * @return {mixed}
         */
        controller: (name) => {
            return api.path('/server/controllers/' + name);
        },
        /**
         * Loads any path in modile
         */
        path: (filePath) => {
            try {
                let promise = require(modulePath + '/' + filePath);
                if (promise && promise.then) {
                    SCli.debug(__MODULE_NAME, 'DEFERRED LOAD ', filePath, moduleName);
                    return promise
                        .then((r) => {
                            SCli.debug(__MODULE_NAME, 'LOADED ', filePath, moduleName);
                            return r;
                        });
                }
                SCli.debug(__MODULE_NAME, 'INSTANT LOAD ', filePath, moduleName);
                return Promise.resolve(promise);
            } catch (error) {
                return Promise.reject(error);
            }
        }
    };

    return api;
};

/**
 * Get LackeyCMS module interface
 * @param   {string} moduleName
 * @returns {object}
 */
exports.cmsMod = function (moduleName) {
    return exports.moduleInterface(LACKEY_PATH + '/../modules/' + moduleName, 'cms/' + moduleName);
};

/**
 * Get project module interface
 * @param   {string} moduleName
 * @returns {object}
 */
exports.mod = function (moduleName) {
    return exports.moduleInterface(exports.getProjectPath() + 'modules/' + moduleName, moduleName);
};

/**
 * Serialize promise chain
 * @param   {listOfItems} array    list of arguments to be passed to promise creator
 * @param   {function} promiseCreator       promise creator
 * @param   {object|null} asObject context
 * @returns {Promise<Results>}
 */
exports.serialPromise = function (listOfItems, promiseCreator, asObject) {

    let current = Promise.resolve(),
        results = asObject ? {} : [];

    listOfItems.forEach((elem, idx) => {
        current = current
            .then(() => {
                let next = promiseCreator(elem, idx);
                if (!next || !next.then) {
                    next = Promise.resolve(next);
                }
                return next
                    .then((result) => {
                        if (!asObject) {
                            results.push(result);
                        } else {
                            results[elem] = result;
                        }
                    });
            });
    });
    return current
        .then(() => {
            return results;
        });
};

/**
 * Error
 * @param {object} error [[Description]]
 */
function failHanlder(error) {
    console.error(error);
    console.error(error.stack);
}

/**
 * Require multple dependenices, that can be represented as promises
 * First arguments is label or requested
 * @returns {Promise}
 */
exports.waitForAs = function () {

    let args = exports.asArr(arguments),
        label = args.shift(),
        promise = Promise.all(args.map((dependency) => {
            if (dependency && dependency.then) {
                return dependency;
            }
            return Promise.resolve(dependency);
        }));

    return {
        then: (onLoad, onFail) => {
            return promise
                .then((list) => {
                    SCli.debug(__MODULE_NAME, 'Resovled all for ' + label);
                    return onLoad.apply(null, list);
                }, onFail || failHanlder);
        }
    };
};

/**
 * Returns any quasi array as array
 * @param   {HTMElementsList|Arguments} input
 * @returns {Array}
 */
exports.asArr = function (input) {
    return Array.prototype.slice.apply(input);
};


/**
 * Returns glob as promise
 * @param {Promise} glob
 */
exports.glob = function (pattern) {
    return new Promise((resolve, reject) => {
        glob(pattern, (err, list) => {
            if (err) {
                return reject(err);
            }
            resolve(list);
        });
    });
};

/**
 * File stats as promise
 * @param {string} filePath
 * @return {Promise}
 */
exports.stats = function (filePath) {
    return new Promise((resolve, reject) => {
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
};

/**
 * File exists as promise
 * @param {string} filePath
 * @return {Promise}
 */
exports.exists = function (filePath) {
    return exports
        .stats(filePath)
        .then((stats) => {
            return (stats && stats.isFile());

        });
};

/**
 * File is dir as promise
 * @param {string} filePath
 * @return {Promise}
 */
exports.isDir = function (filePath) {
    return exports
        .stats(filePath)
        .then((stats) => {
            return (stats && stats.isDirectory());

        });
};

/**
 * fileRead as promise
 * @param {string} filePath
 * @param {string|null} encoding
 * @return {Promise}
 */
exports.read = function (filePath, encoding) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, encoding || 'utf8', (err, content) => {
            if (err) {
                return reject(err);
            }
            resolve(content);
        });
    });
};

/**
 * fileRead sync
 * @param {string} filePath
 * @param {string|null} encoding
 * @return {Promise}
 */
exports.readSync = function (filePath, encoding) {
    return fs.readFileSync(filePath, encoding || 'utf8');
};

/**
 * MkDir as promise
 * @param   {string} dir
 * @returns {Promise}
 */
exports.mkdir = function (dir) {
    return new Promise((resolve, reject) => {
        mkdirp(dir, (err) => {
            if (err) {
                return reject(err);
            }
            resolve(dir);
        });
    });

};

/**
 * Works both as fs.writeFile and fs.write as promise
 * @param {string|int} filePathOrHandle [[Description]]
 * @param {mixed} content
 * @param {string} encoding
 */
exports.write = function (filePathOrHandle, content, encoding, position) {
    SCli.debug(__MODULE_NAME, 'Write ' + filePathOrHandle);
    return new Promise((resolve, reject) => {
        let callback = (err) => {
            SCli.debug(__MODULE_NAME, 'Wrote ' + (err ? 'with' : 'without') + ' error');
            if (err) {
                console.error(err);
                console.error(err.stack);
                return reject(err);
            }
            resolve(true);
        };

        if (typeof filePathOrHandle === 'string') {
            SCli.debug(__MODULE_NAME, 'Write file ' + filePathOrHandle);
            fs.writeFile(filePathOrHandle, content, encoding, callback);
        } else {
            SCli.debug(__MODULE_NAME, 'Write to handle ' + filePathOrHandle);
            fs.write(filePathOrHandle, content, position, encoding, callback);
        }
    });
};

/**
 * Opens file as promise
 * @param   {string} filePath
 * @param   {string} mode
 * @param   {mixed} perms
 * @returns {Promise<int>}
 */
exports.open = function (filePath, mode, perms) {
    return new Promise((resolve, reject) => {
        fs.open(filePath, mode, perms, (err, handle) => {
            if (err) {
                return reject(err);
            }
            resolve(handle);
        });
    });
};

/**
 * Fs.close as promise
 * @param   {integer} handle
 * @returns {Promise}
 */
exports.close = function (handle) {
    return new Promise((resolve, reject) => {
        fs.close(handle, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

/**
 * RimRaf as a promise
 * @param   {string} dir
 * @returns {Promise} [[]]
 */
exports.rifram = function (dir) {
    return new Promise((resolve, reject) => {
        rimraf(dir, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

/**
 * S3 Upload as a promise
 * @param   {string} filePath
 * @param   {string} mime
 * @param   {object}   uploadSettings
 * @param   {string}   uploadSettings.prefix
 * @param   {string}   uploadSettings.accessKeyId
 * @param   {string}   uploadSettings.secretAccessKey
 * @param   {string}   uploadSettings.bucket
 * @returns {Promise}
 */
exports.s3PutObject = function (filePath, mime, uploadSettings) {
    return new Promise((resolve, reject) => {
        let body = fs.createReadStream(filePath),
            key = path.join((uploadSettings.prefix || ''), path.relative(module.exports.getProjectPath() + 'uploads', filePath)),
            upload = new AWS.S3({
                accessKeyId: uploadSettings.accessKeyId,
                secretAccessKey: uploadSettings.secretAccessKey,
                params: {
                    Bucket: uploadSettings.bucket,
                    Key: key,
                    ACL: 'public-read',
                    ContentType: mime
                }
            });
        upload
            .upload({
                Body: body
            })
            .send((err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data.Location);
            });
    });
};
