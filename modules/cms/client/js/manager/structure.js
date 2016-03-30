/* jslint node:true, esnext:true */
/*eslint default-case: 0 */
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

const lackey = require('./../../../../core/client/js'),
    modal = require('./../../../../core/client/js/modal'),
    api = require('./../api');

class Node {

    static changed(handler) {
        this._handlers = this._handlers || [];
        this._handlers.push(handler);
    }

    static _changed() {
        if (!this._handlers) return;
        this._handlers.forEach((handler) => {
            handler();
        });
    }

    constructor(item, label, injectButtons) {

        this._item = item;
        this._label = label;
        this.node = document.createElement('li');
        this.node.className = 'structure structure-' + item.type;

        if (['Fields', 'List', 'Block'].indexOf(item.type) !== -1) {
            this.toggl = document.createElement('a');
            this.toggl.className = 'toggle';
            this.node.appendChild(this.toggl);
            this._expand = lackey.as(this.expand, this);
            lackey.bind(this.toggl, 'click', this._expand);
        }

        let labelNode = document.createElement('span');

        if (label) {
            labelNode.innerText = label;
        }

        if (item.type === 'Block') {
            api.read('/cms/template?path=' + encodeURI(item.template))
                .then((templates) => {
                    if (templates.data && templates.data.length) {
                        labelNode.innerText += ' ' + templates.data[0].name;
                        if (templates.data[0].props && Object.keys(templates.data[0].props).length) {
                            item.props = item.props || {};
                            this.toolbar();
                            this.button('Properties', 'fa-cog', () => {
                                modal.open('cms/cms/properties', {
                                    properties: item.props,
                                    definitions: Object.keys(templates.data[0].props).map((key) => {
                                        return {
                                            $key: key,
                                            item: templates.data[0].props[key]
                                        };
                                    })
                                }, function (rootNode, vars, resolve) {
                                    lackey.bind('lky:close', 'click', () => {
                                        resolve(lackey.form(rootNode));
                                    }, rootNode);
                                }).then((props) => {
                                    console.log(props);
                                    item.props = props;
                                    Node._changed();
                                });
                            });
                        }
                    }
                });
        }

        this.node.appendChild(labelNode);
        this.controls(injectButtons);
        this._list = document.createElement('ul');
        this.node.appendChild(this._list);
        this._nodes = [];
        this.eachInModel(lackey.as(this.append, this));
    }
    controls(injectButtons) {
        switch (this._item.type) {
        case 'List':
            this.listControls();
            break;
        }
        if (injectButtons) {
            this.injected(injectButtons);
        }
    }
    listControls() {
        this.toolbar();
        //this.button('Add block', 'fa-plus', this.add);
    }
    injected(buttons) {
        console.log(buttons);
        let self = this;
        if (!this._toolbar) {
            this.toolbar();
        }
        buttons.forEach((button) => {
            self.button.apply(this, button);
        });
    }
    button(text, icon, handler) {
        let button = document.createElement('a'),
            i = document.createElement('i');
        i.className = 'fa ' + icon;
        button.appendChild(i);
        button.appendChild(document.createTextNode(text));
        this._toolbar.appendChild(button);
        this._buttons.push(button);
        lackey.bind(button, 'click', handler);
    }
    toolbar() {
        if (!this._toolbar) {
            this._buttons = [];
            this._toolbar = document.createElement('div');
            this._toolbar.className = 'toolbar';
            this.node.appendChild(this._toolbar);
        }
    }
    add() {

    }
    remove(item) {
        // at the moment only for lists!!!
        let node;
        this._nodes.forEach((n) => {
            if (n._item === item) {
                node = n;
            }
        });
        if (!node) return;
        this._nodes.splice(this._nodes.indexOf(node), 1);
        this._list.removeChild(node.node);
        this._item.items.splice(this._item.items.indexOf(node._item), 1);
        Node._changed();
    }
    append(item, label, injectedButtons) {
        if (!item) return;
        let node = new Node(item, label, injectedButtons);
        this._nodes.push(node);
        this._list.appendChild(node.node);
    }
    eachInModel(callback) {
        let self = this;
        switch (self._item.type) {
        case 'Fields':
            Object
                .keys(this._item)
                .forEach((key) => {
                    if (key !== 'type') {
                        callback(self._item[key], key);
                    }
                });
            break;
        case 'List':
            self._item
                .items
                .forEach((item) => {
                    callback(item, null, [
                    ['Remove', 'fa-minus', () => {
                                self.remove(item);
                    }
                ]]);
                });
            break;
        case 'Block':
            if (!self._item.fields) return;
            Object
                .keys(self._item.fields)
                .forEach((key) => callback(self._item.fields[key], key));
            break;
        }
    }
    expand() {
        if (lackey.hasClass(this.node, 'expand')) {
            lackey.removeClass(this.node, 'expand');
        } else {
            lackey.addClass(this.node, 'expand');
        }
    }
}

module.exports = Node;
