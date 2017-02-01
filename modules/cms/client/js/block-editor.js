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
*/
const
    lackey = require('core/client/js'),
    debug = require('debug')('lackey-cms/modules/cms/client/js/block-editor');

const commentPrefix = 'BLOCK:';

class BlockEditor {
    constructor(block) {
        debug('Constructor', block);

        var self = this;

        self.block = block;
        self.nodes = [];
        self.elements = [];

        self.bind();
    }

    bind() {
        var self = this,
            currentNode = self.block.start.nextSibling;

        while (currentNode && currentNode !== self.block.end) {
            self.nodes.push(currentNode);

            if (currentNode.tagName) {
                self.elements.push(currentNode);
            }

            currentNode = currentNode.nextSibling;
        }

        self.block.start.parentNode.removeChild(self.block.start);
        self.block.end.parentNode.removeChild(self.block.end);

        self.elements.forEach(element => element.addEventListener('click', (ev) => {
            if (ev.target.hasAttribute('data-lky-pm')) {
                return;
            }

            ev.stopPropagation();
            self.edit();
        }));
    }

    edit() {
        var self = this;

        top.LackeyManager.editBlock('layout.' + self.block.path, self.block.template);
    }


    static init() {
        debug('init');

        if (!top.Lackey || !top.LackeyManager) {
            debug('init - wait');
            setTimeout(() => {
                BlockEditor.init();
            }, 250);
            return;
        }

        var blocks = BlockEditor.getBlocks(document.body);
        for (let blockPath in blocks) {
            let block = blocks[blockPath];

            if (!blocks.hasOwnProperty(blockPath)) { continue; }

            BlockEditor.factory(block);
        }
    }

    static factory(block) {
        debug('factory', block);
        return new BlockEditor(block);
    }

    static getBlocks(root) {
        var comments = BlockEditor.getComments(root)
                .filter(comment => comment.data.startsWith(commentPrefix)),
            blocks = {};

        comments.forEach(comment => {
            var data = comment.data.substring(commentPrefix.length),
                dataKind = data.match(/\w+/)[0],
                parsedData = {}, block;

            parsedData = JSON.parse(data.substring(dataKind.length));
            parsedData.kind = dataKind;

            comment.lackeyBlockData = parsedData;

            block = blocks[parsedData.path] || parsedData;
            block[dataKind] = comment;
            blocks[parsedData.path] = block;
        });

        return blocks;
    }

    static getComments(root) {
        var foundComments = [];
        var elementPath = [root];

        while (elementPath.length > 0) {
            var el = elementPath.pop();
            for (var i = 0; i < el.childNodes.length; i++) {
                var node = el.childNodes[i];
                if (node.nodeType === Node.COMMENT_NODE) {
                    foundComments.push(node);
                } else {
                    elementPath.push(node);
                }
            }
        }

        return foundComments;
    }
}

module.exports = BlockEditor;
