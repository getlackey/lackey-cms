/* eslint no-new:0 */
/* jslint esnext:true, browser:true, node:true */
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
const Media = require('../media'),
      TWEEN = require('tween.js');

require('filedrop');

function animate(time) {
      requestAnimationFrame(animate);
      TWEEN.update(time);
}

requestAnimationFrame(animate);


class DummyImage {
      constructor(original, media, previewArea) {

            let ownerWindow = original.ownerDocument.defaultView;

            this.paddingTop = 0;

            if (ownerWindow !== top) {
                  this.paddingTop = top.document.querySelector('iframe').getBoundingClientRect().top;
            }

            this.original = original;
            this.previewArea = previewArea;

            this.set(media);

      }
      set(media) {

            let original = this.original,
                  position = original.getBoundingClientRect(),
                  paddingTop = this.paddingTop,
                  firstTime = true,
                  self = this;

            if (!this.dummy && original) {
                  if (['IMG', 'VIDEO'].indexOf(original.nodeName) === -1) {
                        this.dummy = new Media(original.cloneNode(false));
                  } else {
                        this.dummy = new Media();
                  }
            } else {
                  firstTime = false;
            }
            this.dummy.set(media);

            if (!firstTime) {
                  this.dummy.node.style.top = '150px';
                  this.dummy.node.style.left = '350px';
            } else {
                  this.previewArea.appendChild(this.dummy.node);
                  this.dummy.node.style.top = (position.top + paddingTop) + 'px';
                  this.dummy.node.style.left = position.left + 'px';
            }

            if (position.width && position.height) {
                  this.dummy.node.style.width = position.width + 'px';
                  this.dummy.node.style.height = position.height + 'px';
            }
            this.dummy.node.style.position = 'fixed';

            if (firstTime) {
                  new TWEEN.Tween({
                              x: position.left,
                              y: (position.top + paddingTop)
                        })
                        .to({
                              x: 350,
                              y: 150
                        }, 500)
                        .onUpdate(function () {
                              self.dummy.node.style.top = this.y + 'px';
                              self.dummy.node.style.left = this.x + 'px';
                        })
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .start();
            }
      }
}

module.exports = DummyImage;
