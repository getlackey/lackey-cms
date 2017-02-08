/* eslint no-cond-assign:0, no-new:0 */
/* jslint browser:true, node:true, esnext:true */
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
const api = require('core/client/js/api'),
    diff = require('jsondiffpatch'),
    emit = require('cms/client/js/emit');

diff.formatters = require('jsondiffpatch/src/formatters');
diff.formatters.console = require('jsondiffpatch/src/formatters/console');
diff.formatters.html.hideUnchanged();

function deepClone(object) {
    return JSON.parse(JSON.stringify(object));
}


/**
 * @module lackey-cms/modules/cms/client/manager
 */

/**
 * @constructs lackey-cms/modules/cms/client/manager/Repository
 */
function Repository(manager) {
    this._manager = manager;
    this._resources = {};
    this._cache = {};
    this._copy = {};
}

emit(Repository.prototype);

/**
 * Gets content object from API or cache
 * @param   {String} type
 * @param   {Number} id
 * @returns {Promise.<Object>}
 */
Repository.prototype.get = function () {

    let self = this,
        contentId,
        type,
        id;

    if (arguments.length === 1) {
        contentId = arguments[0];
        type = contentId.split('-')[0];
        id = contentId.split('-')[1];
    } else {
        type = arguments[0];
        id = arguments[1];
        contentId = type + '-' + id;
    }

    if (!this._resources[contentId]) {
        this._resources[contentId] = this.load(type, id);
    }
    return this._resources[contentId].then(() => {
        return self._copy[contentId];
    });
};

/**
 * Loads content object from API
 * @param   {String} type
 * @param   {Number} id
 * @returns {Promise.<Object>}
 */
Repository.prototype.load = function (type, id) {
    let self = this,
        contentId = type + '-' + id;
    return api
        .read('/cms/' + type + '/' + id)
        .then((content) => {
            self._cache[contentId] = deepClone(content);
            self._copy[contentId] = content;
        });
};

/**
 * Sets cotnent value
 * @param   {String} type
 * @param   {Number} id
 * @param {Object} value
 */
Repository.prototype.set = function (type, id, value) {
    let contentId = type + '-' + id;
    this._copy[contentId] = value;
    this._manager.diff();
    this.emit('changed', {
        type: type,
        id: id
    });
    return Promise.resolve(value);
};

Repository.prototype.notify = function () {
    this.emit('changed', {});
};

/**
 * Resets given resource
 * @param {String}   type
 * @param {Number} id
 */
Repository.prototype.reset = function () {
    let contentId,
        type,
        id;

    if (arguments.length === 1) {
        contentId = arguments[0];
        type = contentId.split('-')[0];
        id = contentId.split('-')[1];
    } else {
        type = arguments[0];
        id = arguments[1];
        contentId = type + '-' + id;
    }
    this._copy[contentId] = deepClone(this._cache[contentId]);
    this.emit('changed', {
        type: type,
        id: id
    });
    this.emit('reset', {
        type: type,
        id: id
    });
    this._manager.onStructureChange();
};

/**
 * Resets given resource
 * @param {String}   type
 * @param {Number} id
 */
Repository.prototype.apply = function (type, id) {
    let contentId = type + '-' + id;
    this._cache[contentId] = deepClone(this._copy[contentId]);
    this.emit('changed', {
        type: type,
        id: id
    });
    this.emit('apply', {
        type: type,
        id: id
    });
};

Repository.prototype.save = function () {
    let contentId,
        type,
        id,
        self = this;

    if (arguments.length === 1) {
        contentId = arguments[0];
        type = contentId.split('-')[0];
        id = contentId.split('-')[1];
    } else {
        type = arguments[0];
        id = arguments[1];
        contentId = type + '-' + id;
    }

    let clearData = deepClone(this._copy[contentId]);
    delete clearData.template;

    return api
        .update('/cms/' + type + '/' + id, clearData)
        .then(() => {
            return self.apply(type, id);
        });
};

Repository.prototype.saveAll = function () {
    let self = this;
    return Promise.all(Object.keys(this._copy).map((key) => self.save(key)));
};

Repository.prototype.resetAll = function () {
    let self = this;
    return Promise.all(Object.keys(this._copy).map((key) => self.reset(key)));
};

Repository.prototype.diff = function () {
    let left = deepClone(this._cache);
    return diff.diff(left, deepClone(this._copy));
};

Repository.prototype.visualDiff = function () {
    let left = deepClone(this._cache),
        delta = diff.diff(left, deepClone(this._copy));
    return diff.formatters.html.format(delta, left);
};

module.exports = Repository;
