/* eslint */
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
const modal = require('../../../core/client/js/modal'),
      template = require('../../../core/client/js/template'),
      lackey = require('./../../../core/client/js'),
      TWEEN = require('tween.js'),
      api = require('./api');

require('filedrop');

requestAnimationFrame(animate);

function animate(time) {
      requestAnimationFrame(animate);
      TWEEN.update(time);
}

/**
 * Transforms file object to data-uris
 * @param   {FileList} files [[Description]]
 * @returns {Promise} [[Description]]
 */
function filesToURIs(files) {
      let promises = [];
      files.each((file) => {
            promises.push(
                  new Promise((resolve, reject) => {
                        file.readDataURL(
                              function (str) {
                                    resolve({
                                          mime: file.mime,
                                          name: file.name,
                                          data: str,
                                          size: file.size
                                    });
                              },
                              function (e) {
                                    reject(e);
                              },
                              'text'
                        );
                  }));
      });
      return Promise.all(promises);
}

class DummyImage {
      constructor(original, previewArea) {
            let dummy,
                  position = original.getBoundingClientRect(),
                  ownerWindow = original.ownerDocument.defaultView,
                  paddingTop = 0;

            if (ownerWindow !== top) {
                  paddingTop = top.document.querySelector('iframe').getBoundingClientRect().top;
            }

            dummy = document.createElement('img');
            dummy.src = original.src;
            dummy.style.width = position.width + 'px';
            dummy.style.height = position.height + 'px';
            dummy.style.position = 'fixed';
            dummy.style.top = (position.top + paddingTop) + 'px';
            dummy.style.left = position.left + 'px';
            previewArea.appendChild(dummy);
            this.dummy = dummy;
            let tween = new TWEEN.Tween({
                        x: position.left,
                        y: (position.top + paddingTop)
                  })
                  .to({
                        x: 350,
                        y: 150
                  }, 500)
                  .onUpdate(function () {
                        dummy.style.top = this.y + 'px';
                        dummy.style.left = this.x + 'px';
                  })
                  .easing(TWEEN.Easing.Quadratic.Out)
                  .start();


      }
      set src(url) {
            this.dummy.src = url;
      }
      get src() {
            return this.dummy.src;
      }
}

class MediaRepository {
      constructor(root) {
            let self = this;
            this._listeners = [];
            this.root = root;
            this.zone = new window.FileDrop(lackey.hook('dropZone', root), {
                  multiple: false
            });
            this.zone.event('send', function (files) {
                  let count = files.length;
                  files.each((file, idx) => {
                        let index = idx;
                        file.event('done', (xhr) => {
                              if (index === 0) {
                                    let data = JSON.parse(xhr.responseText);
                                    self.select(data.id, data.sources.src);
                              }

                              if (--count === 0) {
                                    //done
                              }

                        });
                        file.sendTo('/api/cms/media');
                  });
            });
            this.list();
      }
      select(id, url) {
            this._listeners.forEach((listener) => {
                  listener(id, url);
            });
      }
      list() {
            let self = this;
            api
                  .read('/cms/media?limit=20&sort=-createdAt')
                  .then((list) => {
                        return template.redraw('list', {
                              uploaded: list.data
                        }, self.root);
                  })
                  .then(() => {
                        lackey.bind('lky:image', 'click', (event, hook) => {
                              event.preventDefault();
                              event.cancelBubble = true;
                              self.select(hook.getAttribute('data-lky-id'), hook.getAttribute('data-lky-src'));
                              return false;
                        }, self.root);
                  });
      }
      selected(listener) {
            this._listeners.push(listener);
      }

}

/**
 * Image manage modal controller - TODO maybe should move away to media module
 * @param {HTMLElement} rootNode modal root node
 * @param {object}      vars     passed parameters
 * @param {Function}    resolve  success promisse resolution
 */
function modalController(rootNode, vars, resolve) {

      let dummy,
            result,
            resultSRC,
            repository;

      if (vars.node && vars.node.nodeName === 'IMG') {
            dummy = new DummyImage(vars.node, lackey.hooks('preview', rootNode)[0]);
      }

      lackey.bind('lky:close', 'click', () => resolve(), rootNode);
      lackey.bind('lky:use', 'click', () => {
            if (result) {
                  return resolve({
                        id: result,
                        sources: {
                              src: resultSRC
                        }
                  });
            }
            resolve();


      }, rootNode);

      repository = new MediaRepository(rootNode);
      repository.selected((id, url) => {
            dummy.src = url;
            result = id;
            resultSRC = url;
      });

}

lackey.bind('[data-lky-image]', 'click', (event, hook) => {

      let vars = JSON.parse(hook.getAttribute('data-lky-image'));
      vars.node = hook;
      return modal
            .open('cms/cms/image', vars, modalController)
            .then((result) => {

                  if (!result) {
                        return;
                  }

                  lackey.emit('cms/cms/image:selected', {
                        type: 'Media',
                        id: result.id,
                        hook: hook
                  });

                  if (hook.nodeName === 'IMG') {
                        hook.src = result.sources.src;
                  } else {
                        hook.style.backgroundImage = 'url(\'' + result.sources.src + '\')';
                  }
            });

});
