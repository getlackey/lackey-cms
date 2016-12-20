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
const lackey = require('core/client/js'),
    emit = require('cms/client/js/emit'),
    growl = require('cms/client/js/growl');

/**
 * @module lackey-cms/modules/cms/client/manager
 */

/**
 * @constructs lackey-cms/modules/cms/client/manager/ChangeUI
 * @param {HTMLElement} parentNode
 * @param {Repository} repository
 * @param {Object}
 */
function ChangeUI(repository) {
    this.repository = repository;
    this.bindUI();
}

emit(ChangeUI.prototype);

ChangeUI.prototype.bindUI = function () {
    this._save = lackey.hook('header.save');
    this._cancel = lackey.hook('header.cancel');
    this._changes = lackey.hook('header.changes');

    this._changeHandler = this.onChange.bind(this);
    this.repository.on('changed', this._changeHandler);

    this._cancel.addEventListener('click', this.cancel.bind(this), true);
    this._save.addEventListener('click', this.save.bind(this), true);

    this.onChange();
};

ChangeUI.prototype.cancel = function (event) {
    event.stopPropagation();
    event.preventDefault();
    this.repository.resetAll();
    this.uiUpdate(false);
};

ChangeUI.prototype.save = function (event) {
    var self = this;
    event.stopPropagation();
    event.preventDefault();
    this
        .repository
        .saveAll()
        .then(() => {
            growl({
                status: 'success',
                message: 'Change have been saved!'
            });
            self.uiUpdate(false);
        });
};

ChangeUI.prototype.onChange = function () {

    let diff = this.repository.diff(),
        keys = diff ? Object.keys(diff) : [],
        changesCount = keys.length;

    if (changesCount > 0) {
        this.uiUpdate(true);
    } else {
        this.uiUpdate(false);
    }
};

ChangeUI.prototype.uiUpdate = function (state) {
    if (state) {
        this._save.removeAttribute('disabled');
        this._changes.setAttribute('data-lky-active', '');
    } else {
        this._save.setAttribute('disabled', '');
        this._changes.removeAttribute('data-lky-active');
    }
};

ChangeUI.prototype.state = function (element, state) {
    if (state === 'disabled') {
        element.setAttribute('disabled', '');
    } else {
        element.removeAttribute('disabled');
    }
    element.style.display = state === 'hidden' ? 'none' : '';
};

ChangeUI.prototype.destroy = function () {
    this.repository.off('changed', this._changeHandler);
    this._nodes.forEach((node) => {
        node.parentNode.removeChild(node);
    });
    delete this._nodes;
    delete this._changeHandler;
    delete this.repository;
};

module.exports = ChangeUI;
