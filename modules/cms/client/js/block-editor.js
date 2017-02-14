/* eslint no-cond-assign:0, no-new:0, no-use-before-define:0, no-continue:0 */
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
    debug = require('debug')('lackey-cms/modules/cms/client/js/block-editor');

const commentPrefix = 'BLOCK:';

var _editButton,
    _overlay;

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

        self.elements.forEach(element => {
            element.addEventListener('mouseover', ev => self.onBlockOver(ev));
            element.addEventListener('mouseleave', ev => self.onBlockLeave(ev));
        });
    }

    edit() {
        var self = this;

        top.LackeyManager.editBlock('layout.' + self.block.path, self.block.template);
    }

    getAbsoluteBoundingRect() {
        var self = this,
            left = Infinity, top = Infinity,
            right = -Infinity, bottom = -Infinity;

        self.elements.forEach(element => {
            let elementBounds = getAbsoluteBoundingRect(element);

            if (elementBounds.width === 0 && elementBounds.height === 0) {
                return;
            }

            left = Math.min(left, elementBounds.left);
            top = Math.min(top, elementBounds.top);
            right = Math.max(right, elementBounds.right);
            bottom = Math.max(bottom, elementBounds.bottom);
        });

        return {
            left: left,
            top: top,
            right: right,
            bottom: bottom,
            width: right - left,
            height: bottom - top
        };
    }

    get isMouseOver() {
        var self = this;

        return self.elements.some(element => element.isMouseOver);
    }

    checkMouseState(ev) {
        var self = this;

        if (self.isMouseOver) {
            if (ev) { ev.stopPropagation(); }

            BlockEditor.setEditTarget(self, self.getAbsoluteBoundingRect());
        }
    }

    onBlockOver(ev) {
        var self = this;

        ev.currentTarget.isMouseOver = true;

        self.checkMouseState(ev);
    }

    onBlockLeave(ev) {
        var self = this;

        ev.currentTarget.isMouseOver = false;

        self.checkMouseState(ev);
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

        BlockEditor.startRendering();
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
                parsedData = {}, block, blockKey;

            parsedData = JSON.parse(data.substring(dataKind.length));
            comment.lackeyBlockData = parsedData;

            if (parsedData.path && parsedData.template) {
                blockKey = parsedData.path + parsedData.template;

                block = blocks[blockKey] || parsedData;
                block[dataKind] = comment;
                blocks[blockKey] = block;
            } else {
                if (parsedData.path && !parsedData.template) {
                    console.warn('Block was rendered without a template! Path: ', parsedData.path);
                }

                comment.parentNode.removeChild(comment);
            }
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


    static setEditTarget(block, bounds) {
        BlockEditor.updateEditButton(block, bounds);
        BlockEditor.updateOverlay(block, bounds);

        BlockEditor.activeBlock = block;

        return true;
    }


    static get editButton() {
        if (!_editButton) {
            _editButton = document.createElement('button');

            _editButton.setAttribute('class', 'lky-edit-block');

            _editButton.addEventListener('click', (ev) => BlockEditor._onEditButtonClick(ev));

            document.body.appendChild(_editButton);
        }

        return _editButton;
    }

    static updateEditButton(block, bounds) {
        BlockEditor.updateEditButtonPosition(bounds);

        if (BlockEditor.activeBlock !== block) {
            BlockEditor.editButton.setAttribute('data-target-change', '');
            reflow(BlockEditor.editButton);
            BlockEditor.editButton.removeAttribute('data-target-change');
        }
    }

    static updateEditButtonPosition(bounds) {
        BlockEditor.editButton.style.right = (document.body.clientWidth - bounds.right) + 'px';
        BlockEditor.editButton.style.top = bounds.top + 'px';
    }

    static _onEditButtonClick(ev) {
        ev.stopPropagation();

        if (BlockEditor.activeBlock) {
            BlockEditor.activeBlock.edit();
        }
    }


    static get overlay() {
        if (!_overlay) {
            _overlay = document.createElement('figure');

            _overlay.setAttribute('class', 'lky-block-overlay');

            document.body.appendChild(_overlay);
        }

        return _overlay;
    }

    static updateOverlay(block, bounds) {
        BlockEditor.updateOverlayBounds(bounds);

        if (BlockEditor.activeBlock !== block) {
            BlockEditor.overlay.setAttribute('data-target-change', '');
            reflow(BlockEditor.overlay);
            BlockEditor.overlay.removeAttribute('data-target-change');
        }
    }

    static updateOverlayBounds(bounds) {
        BlockEditor.overlay.style.left = bounds.left + 'px';
        BlockEditor.overlay.style.top = bounds.top + 'px';
        BlockEditor.overlay.style.width = bounds.width + 'px';
        BlockEditor.overlay.style.height = bounds.height + 'px';
    }


    static startRendering() {
        var render = () => {
            if (BlockEditor.activeBlock) {
                let bounds = BlockEditor.activeBlock.getAbsoluteBoundingRect();

                if (BlockEditor.bounds && areBoundsEqual(BlockEditor.bounds, bounds)) {
                    window.requestAnimationFrame(render);
                    return;
                }
                BlockEditor.bounds = bounds;

                BlockEditor.updateOverlayBounds(bounds);
                BlockEditor.updateEditButtonPosition(bounds);
            }

            window.requestAnimationFrame(render);
        };

        render();
    }
}
BlockEditor.activeBlock = null;

module.exports = BlockEditor;

function getAbsoluteBoundingRect(element) {
    var offsetX = window.pageXOffset,
        offsetY = window.pageYOffset,
        rect = element.getBoundingClientRect();

    if (element !== document.body) {
        var parent = element.parentNode;

        while (parent !== document.body) {
            offsetX += parent.scrollLeft;
            offsetY += parent.scrollTop;
            parent = parent.parentNode;
        }
    }

    return {
        bottom: rect.bottom + offsetY,
        height: rect.height,
        left: rect.left + offsetX,
        right: rect.right + offsetX,
        top: rect.top + offsetY,
        width: rect.width
    };
}

function areBoundsEqual(a, b) {
    return a.left === b.left && a.top === b.top && a.right === b.right && a.bottom === b.bottom;
}

function reflow(element) {
    void element.offsetWidth;
}
