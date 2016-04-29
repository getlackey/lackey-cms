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
const template = require('./../../../../core/client/js/template'),
      lackey = require('./../../../../core/client/js'),
      DummyImage = require('./dummy'),
      api = require('./../api');

require('filedrop');

class MediaRepository {
      constructor(root, options) {
            let self = this;

            this.page = 1;
            this.total = 0;
            this.filter = null;
            this.search = null;
            this.onClick = lackey.as(this._onClick, this);

            if (options) {
                  if (options.prev) {
                        this.prev = options.prev;
                        lackey.hide(this.prev);
                        lackey.bind(this.prev, 'click', () => {
                              self.page -= 1;
                              self.list();
                        });
                  }
                  if (options.next) {
                        this.next = options.next;
                        lackey.hide(this.next);
                        lackey.bind(this.next, 'click', () => {
                              self.page += 1;
                              self.list();
                        });
                  }
                  if(options.filter) {
                        lackey.bind(options.filter, 'click', () => {
                              self.page = 1;
                              self.list();
                        });
                  }
                  if(options.reset) {
                        lackey.bind(options.reset, 'click', () => {
                              if(self.search) {
                                    self.search.value = '';
                              }
                              self.page = 1;
                              self.list();
                        });
                  }
                  if(options.filterInput) {
                        this.search = options.filterInput;
                  }
            }

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
                                    self.select(data);
                              }

                              if (--count === 0) {
                                    //done
                              }

                        });
                        file.sendTo('/api/cms/media');
                  });
            });
            this.zone.event('iframeDone', function (xhr) {
                  console.log(xhr.responseText);
            });
            this.zone.event('upload', function () {});
            this.list();
      }
      select(id, url, type) {
            this._listeners.forEach((listener) => {
                  listener(id, url, type);
            });
      }
      _onClick(event, hook) {
            event.preventDefault();
            event.cancelBubble = true;
            this.select(JSON.parse(hook.getAttribute('data-lky-media')));
            return false;
      }
      list() {
            let self = this,
                query = this.search ? this.search.value : null,
                url = '/cms/media?limit=10&sort=-createdAt&page=' + self.page;

            if(query) {
                  url += '&q=' + encodeURIComponent(query);
            }

            lackey.unbind('lky:image', 'click', self.onClick, self.root);

            api
                  .read(url)
                  .then((list) => {
                        if (list.paging.page > 1) {
                              lackey.show(self.prev);
                        } else {
                              lackey.hide(self.prev);
                        }
                        if (list.paging.pages > list.paging.page) {
                              lackey.show(self.next);
                        } else {
                              lackey.hide(self.next);
                        }
                        return template.redraw('list', {
                              uploaded: list.data
                        }, self.root);
                  })
                  .then(() => {
                        lackey.bind('lky:image', 'click', self.onClick, self.root);
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
function ModalController(rootNode, vars, resolve) {

      let dummy,
            result,
            repository;

      dummy = new DummyImage(vars.node, vars.media, lackey.hooks('preview', rootNode)[0]);

      lackey.bind('lky:close', 'click', () => resolve(), rootNode);
      lackey.bind('lky:add', 'click', () => {
            let url = lackey.hook('url', rootNode).value;
            api.create('/cms/media', {
                  source: url
            }).then((media) => {
                  result = media;
                  dummy.set(media);
            });
      });
      lackey.bind('lky:remove', 'click', () => {
            result = -1;
            dummy.set(null);
      });

      lackey.bind('lky:use', 'click', () => {
            if (result) {
                  return resolve(result);
            }
            resolve();

      }, rootNode);

      repository = new MediaRepository(rootNode, {
            prev: lackey.hook('prev', rootNode),
            next: lackey.hook('next', rootNode),
            filter: lackey.hook('filter', rootNode),
            filterInput: lackey.hook('search', rootNode),
            reset: lackey.hook('reset', rootNode)
      });
      repository.selected((media) => {
            dummy.set(media);
            result = media;
      });

}

module.exports = ModalController;
