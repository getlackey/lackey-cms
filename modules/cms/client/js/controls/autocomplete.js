/* eslint no-cond-assign:0 */
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
    optionsFactory = require('core/client/js/options'),
    emit = require('cms/client/js/emit');

function kill(event) {
    event.preventDefault();
    event.stopPropagation();
}

/**
 * @module lackey-cms/modules/cms/client/js/controls
 */

/**
 * @name Autocomplete
 * Autocomplete
 * @param {HTMLElement} root
 * @param {Object}   options
 */
function Autocomplete(root, options) {
    this._options = optionsFactory(this, options);
    this.value = Array.isArray(this._options.value) ? this._options.value : [];
    this.draw(root);
}

emit(Autocomplete.prototype);

Autocomplete.prototype.equals = function (tagA, term) {
    return tagA === term;
};


Autocomplete.defaultOptions = {
    separators: [
        13,
        20,
        188
    ],
    createNew: true
};

Autocomplete.prototype.changed = function () {
    this.emit('changed', this.value);
};

Autocomplete.prototype.draw = function (hook) {

    this._root = document.createElement('div');
    this._root.setAttribute('data-lky-autocomplete', '');
    this._root.addEventListener('click', lackey.as(this.focus, this), true);

    this._selected = null;
    this._selectedIndex = -1;

    this._list = document.createElement('ul');
    this._list.setAttribute('data-lky-tags', '');
    this.drawTags();

    this._hidden = document.createElement('input');
    this._hidden.setAttribute('type', 'hidden');

    this._text = document.createElement('input');
    this._text.setAttribute('type', 'text');
    this._text.addEventListener('keyup', lackey.as(this.onType, this), true);
    this._text.addEventListener('keydown', lackey.as(this.onBeforeType, this), true);

    this._suggestions = document.createElement('ul');
    this._suggestions.setAttribute('data-lky-suggestions', '');

    this._root.appendChild(this._hidden);
    this._root.appendChild(this._list);
    this._root.appendChild(this._text);
    this._root.appendChild(this._suggestions);
    hook.appendChild(this._root);
};

Autocomplete.prototype.focus = function () {
    this._text.focus();
};

Autocomplete.prototype.drawTags = function () {
    let self = this;
    this._list.innerHTML = '';
    this.value.forEach((item) => {
        self._list.appendChild(self.drawTag(item, function () {
            self.value.splice(self.value.indexOf(item), 1);
            self.changed();
            self.drawTags();
        }));
    });
};

Autocomplete.prototype.drawTag = function (item, removeHandler) {
    let tag = document.createElement('li'),
        span = document.createElement('span'),
        close = document.createElement('a');

    span.innerText = this._options.formatLabel ? this._options.formatLabel(item) : item;
    close.innerHTML = '&times';
    close.addEventListener('click', removeHandler, true);

    tag.appendChild(span);
    tag.appendChild(close);

    return tag;
};

Autocomplete.prototype.removeLastTag = function () {
    this.value.pop();
    this.changed();
    this.drawTags();
};

Autocomplete.prototype.addTag = function (tag) {
    let has = false,
        self = this;
    this.value.forEach((existing) => {
        if ((self._options.equals || self.equals)(tag, existing)) {
            has = true;
        }
    });
    if (!has) {
        this.value.push(tag);
        this.changed();
    }
    this.drawTags();
};

Autocomplete.prototype.onType = function (event) {

    let clean = this._text.value.replace(/\s\s+|^\s+|\s$/g, ''),
        key = event.which || event.keyCode;

    if ([8, 38, 40].indexOf(key) !== -1) {
        return;
    }

    if (this._pending) {
        return;
    }

    if (clean.length <= 2) {
        return;
    }

    this._pending = this.query(clean);
};

Autocomplete.prototype.onBeforeType = function (event) {

    let clean = this._text.value.replace(/\s\s+|^\s+|\s$/g, ''),
        key = event.which || event.keyCode;

    if (clean.length === 0 && key === 8) {
        this.removeLastTag();
    } else if (clean.length && this._options.separators.indexOf(key) !== -1) {
        this.confirm(clean);
        this._text.value = '';
        kill(event);
    } else if (key === 38) /* up */ {
        this.up();
        kill(event);
    } else if (key === 40) /* down */ {
        this.down();
        kill(event);
    }
};

Autocomplete.prototype.up = function () {
    this.selectIndex((this._selected ? this._selectedIndex : this._suggestions.childNodes.length) - 1);
};

Autocomplete.prototype.down = function () {
    this.selectIndex((this._selected ? this._selectedIndex : -1) + 1);
};

Autocomplete.prototype.selectIndex = function (index) {
    if (this._selected) {
        this._suggestions.childNodes[this._selectedIndex].removeAttribute('data-lky-selected');
    }
    if(!this._suggestions.childNodes[index]) {
        return;
    }
    this._selected = this._suggestions.childNodes[index]._item;
    this._selectedIndex = index;
    this._suggestions.childNodes[index].setAttribute('data-lky-selected', '');
};

Autocomplete.prototype.confirm = function (term) {
    if (this._selected) {
        this.addTag(this._selected);
        this._selected = null;
    } else if (this._options.createNew) {
        this.addTag(term);
    }
    this._suggestions.innerHTML = '';
    this._selected = null;
    this._selectedIndex = -1;
};

Autocomplete.prototype.addSuggestion = function (item) {
    let li = document.createElement('li');
    li._item = item;
    li.innerText = item;
    return li;
};

Autocomplete.prototype.selectBest = function (term) {
    let
        self = this,
        children = [].slice.apply(this._suggestions.childNodes);

    // exact match
    children.forEach(function (li, index) {
        let item = li._item;
        if (self._selected === null && (self._options.equals || self.equals)(item, term)) {
            self.selectIndex(index);
        }
    });
    if (this._selected || this._options.createNew) {
        return;
    }
    self.selectIndex(0);

};

Autocomplete.prototype.query = function (term) {
    let self = this,
        promise = (!this._options.query) ? Promise.resolve([term]) : this._options.query(term);

    self._selected = null;

    promise.then((list) => {
        self._suggestions.innerHTML = '';
        self._selected = null;
        list.forEach((item) => {
            let li = (self._options.addSuggestion || self.addSuggestion)(item, term);
            li._item = item;
            li.innerText = self._options.formatLabel ? self._options.formatLabel(item) : item;

            self._suggestions.appendChild(li);
        });
        self.selectBest(term);
        self._pending = null;
    });

    return promise;
};

Autocomplete.prototype.destroy = function () {
    this._root.innerHTML = '';
};

module.exports = Autocomplete;
