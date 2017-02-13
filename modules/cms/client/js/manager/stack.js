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
const
    emit = require('cms/client/js/emit'),
    StructureUI = require('cms/client/js/manager/structure.ui.js'),
    ArticlePicker = require('cms/client/js/manager/article.picker.ui.js'),
    BlockPicker = require('cms/client/js/manager/block.picker.ui.js'),
    DateTimePicker = require('cms/client/js/manager/datetime.picker.ui.js'),
    Gallery = require('cms/client/js/manager/gallery.ui.js'),
    UserPricker = require('cms/client/js/manager/user.picker.ui.js'),
    TaxonomyPricker = require('cms/client/js/manager/taxonomy.picker.ui.js'),
    RolePicker = require('cms/client/js/manager/role.picker.ui.js'),
    SourceEditor = require('cms/client/js/manager/sources.editor.ui.js'),
    lackey = require('core/client/js');
/**
 * @module lackey-cms/modules/cms/client/manager
 */

/**
 * @constructs lackey-cms/modules/cms/client/manager/Stack
 */
function Stack(repository, manager) {

    this._repository = repository;
    this.manager = manager;
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

Stack.prototype.inspectStructure = function (structureController, tab) {
    try {
        lackey.hook('main-area').setAttribute('data-lky-settings-open', 'true');

        let self = this,
            promise = structureController
            .buildUI()
            .then(element => {
                if (tab) {
                    element.setAttribute('data-lky-edit', tab);
                }
                self.node.appendChild(element);
                return structureController.fadeIn();
            });

        this._stack.push(structureController);
        self.emit('inspect');

        return promise;
    } catch (e) {
        console.log(e);
    }
};

Stack.prototype.pick = function (picker, pop) {

    lackey.hook('main-area').setAttribute('data-lky-settings-open', 'true');

    let self = this;

    picker
        .buildUI()
        .then(element => {
            self.node.appendChild(element);
            return picker.fadeIn();
        });

    this._stack.push(picker);
    self.emit('pick');

    return picker
        .promise
        .then(rt => {
            self.pop(pop);
            return rt;
        }, () => {
            self.pop(pop);
            return null;
        });
};

Stack.prototype.pickArticle = function (route) {
    return this
        .pick(new ArticlePicker({
            route: route,
            stack: this
        }), true);
};

Stack.prototype.editSource = function (source) {
    return this
        .pick(new SourceEditor({
            source: source,
            stack: this
        }), true);
};

Stack.prototype.pickUser = function (userId) {
    return this
        .pick(new UserPricker({
            route: userId,
            stack: this
        }), true);
};

Stack.prototype.pickTaxonomy = function (taxonmyType, addable) {
    return this
        .pick(new TaxonomyPricker({
            type: taxonmyType,
            addable: !!addable,
            stack: this
        }), true);
};

Stack.prototype.pickRole = function () {
    return this
        .pick(new RolePicker({
            stack: this
        }), true);
};

Stack.prototype.pickBlock = function () {
    return this
        .pick(new BlockPicker({
            stack: this
        }), undefined);
};

Stack.prototype.pickDateTime = function (current) {

    let dateTime = new Date();
    try {
        dateTime = (current && current instanceof Date) ? current : new Date(current);
    } catch (e) {
        console.error(e);
    }

    return this
        .pick(new DateTimePicker({
            stack: this,
            current: dateTime
        }), true);
};

Stack.prototype.inspectMedia = function (media, node) {
    return this
        .pick(new Gallery({
            media: media,
            node: node,
            stack: this,
            manager: this.manager
        }), true);
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
