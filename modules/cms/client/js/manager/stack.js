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
const emit = require('cms/client/js/emit'),
    StructureUI = require('cms/client/js/manager/structure.ui.js'),
    ArticlePicker = require('cms/client/js/manager/article.picker.ui.js'),
    BlockPicker = require('cms/client/js/manager/block.picker.ui.js'),
    Gallery = require('cms/client/js/manager/gallery.ui.js'),
    lackey = require('core/client/js');
/**
 * @module lackey-cms/modules/cms/client/manager
 */

/**
 * @constructs lackey-cms/modules/cms/client/manager/Stack
 */
function Stack(repository) {

    this._repository = repository;
    this._stack = [];

    Object.defineProperty(this, 'length', {
        /**
         * @property {Object}
         * @name Stack#length
         */
        get: function () {
            return this._stack.length;
        }
    });

    Object.defineProperty(this, 'current', {
        /**
         * @property {Object}
         * @name Stack#current
         */
        get: function () {
            return this._stack[this._stack.length - 1] || null;
        }
    });

    Object.defineProperty(this, 'node', {
        get: function () {
            return lackey.select('[data-lky-hook="main-area"]', top.document.body)[0];
        }
    });

    /*this.node.addEventListener('mousewheel', (e) => {
        if (e.srcElement === self.node) {
            let content = lackey.hook('iframe', top.document.body).contentDocument.body;
            content.scrollTop = (e.wheelDelta * -1) + content.scrollTop;
        }
    }, true);*/
}

Stack.prototype.inspectStructure = function (structureController) {

    lackey.hook('main-area').setAttribute('data-lky-settings-open', 'true');

    let self = this,
        promise = structureController
        .buildUI()
        .then((element) => {
            self.node.appendChild(element);
            return structureController.fadeIn();
        });

    this._stack.push(structureController);

    return promise;
};

Stack.prototype.pickArticle = function (route) {

    lackey.hook('main-area').setAttribute('data-lky-settings-open', 'true');

    let self = this,
        articlePicker = new ArticlePicker({
            route: route,
            stack: this
        });

    articlePicker
        .buildUI()
        .then((element) => {
            self.node.appendChild(element);
            return articlePicker.fadeIn();
        });

    this._stack.push(articlePicker);

    return articlePicker
        .promise
        .then((rt) => {
            self.pop();
            return rt;
        });
};

Stack.prototype.pickBlock = function () {

    lackey.hook('main-area').setAttribute('data-lky-settings-open', 'true');

    let self = this,
        blockPicker = new BlockPicker({
            stack: this
        });

    blockPicker
        .buildUI()
        .then((element) => {
            self.node.appendChild(element);
            return blockPicker.fadeIn();
        });

    this._stack.push(blockPicker);

    return blockPicker
        .promise
        .then((rt) => {
            self.pop();
            return rt;
        });
};

Stack.prototype.inspectMedia = function (media, node) {

    lackey.hook('main-area').setAttribute('data-lky-settings-open', 'true');

    let self = this,
        gallery = new Gallery({
            media: media,
            node: node,
            stack: this
        });

    gallery
        .buildUI(true)
        .then((element) => {
            self.node.appendChild(element);
            return gallery.fadeIn();
        });

    this._stack.push(gallery);

    return gallery
        .promise
        .then((mediaObject) => {
            self.pop(true);
            return mediaObject;
        });
};

/**
 * Removes item from top of the stack
 */
Stack.prototype.pop = function (clearing) {

    let self = this,
        item = this._stack.pop();

    if (!item) {
        return Promise.resolve();
    }

    return item
        .remove()
        .then(() => {
            if (self._stack.length && !clearing) {
                if (self._stack[self._stack.length - 1] instanceof StructureUI) {
                    self._stack[self._stack.length - 1].node.setAttribute('data-lky-edit', 'blocks');
                }
            }
            if (!self._stack.length) {
                lackey.hook('main-area').removeAttribute('data-lky-settings-open');
            }
        });

};

Stack.prototype.clear = function () {
    let self = this;

    return this
        .pop(true)
        .then(() => {
            if (self._stack.length) {
                return self.clear();
            }
            lackey.hook('main-area').removeAttribute('data-lky-settings-open');
            return true;
        });
};

emit(Stack.prototype);

module.exports = Stack;
