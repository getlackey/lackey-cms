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
const lackey = require('core/client/js'),
      Upload = require('core/client/js/upload'),
      youtube = require('cms/shared/youtube'),
      vimeo = require('cms/shared/vimeo');

class Media {
      static get manager() {
            return top.LackeyManager;
      }
      constructor(HTMLElement, noInput) {

            this._listeners = [];
            this.node = HTMLElement;
            this.attributes = {};

            if (!noInput) {
                  this.input = document.createElement('input');
                  this.input.setAttribute('type', 'file');
                  this.input.setAttribute('name', 'files[]');
                  this.input.setAttribute('multiple', '');
                  this.input.style.position = 'absolute';
                  this.input.style.marginLeft = '-1000px';
            }

            this.onClick = (function () {
                  let self = this;
                  this._listeners
                        .forEach(listener => {
                              listener(self);
                        });
            }).bind(this);

            if (this.node) {

                  this.content = HTMLElement.getAttribute('data-lky-content') || false;
                  this.path = HTMLElement.getAttribute('data-lky-path') || null;
                  this.variant = HTMLElement.getAttribute('data-lky-variant');
                  this.update = HTMLElement.getAttribute('data-lky-update');
                  this.updatePattern = HTMLElement.getAttribute('data-lky-update-pattern');
                  this.mediaType = HTMLElement.getAttribute('data-lky-media-type');

                  if (this.mediaType === 'hook' && !this.update) {

                        this.update = 'style.backgroundImage';
                        this.updatePattern = 'url($1)';
                  }
                  this.attributes = JSON.parse(HTMLElement.getAttribute('data-lky-attributes') || '{}');
                  if (HTMLElement.hasAttribute('data-lky-media')) {
                        this.set(JSON.parse(HTMLElement.getAttribute('data-lky-media')));
                  }

                  if (HTMLElement.hasAttribute('markdown-type')) {
                        this.set({
                              media: 'video/' + HTMLElement.getAttribute('markdown-type'),
                              source: HTMLElement.getAttribute('markdown-src')
                        });

                  }
            }

      }
      render() {
            if (this.update) {
                  this.node.addEventListener('click', this.onClick, true);
                  if (this.media.source) {
                      return this.field(this.node, this.update, this.updatePattern.replace('$1', Media.clearSource(this.media.source)));
                  }
                  return;
            }
            if (this.media && this.media.mime && this.media.mime.match(/^video\//)) {
                  return this.renderVideo();
            }
            if (this.media && this.media.mime && !this.media.mime.match(/^image\//)) {
                  return this.renderFile();
            }
            this.renderImage();
      }
      replace(newTag) {
            let self = this;
            Object.keys(this.attributes)
                  .forEach(attr => {
                        newTag.setAttribute(attr, self.attributes[attr]);
                  });
            if (this.node) {
                  this.node.removeEventListener('click', this.onClick, true);
                  this.node.parentNode.insertBefore(newTag, this.node);
                  this.node.parentNode.removeChild(this.node);
            }
            if (this.upload) {
                  this.upload.destroy();
                  this.upload = null;
            }
            this.node = newTag;
            this.node.addEventListener('click', this.onClick, true);
            this.upload = new Upload(this.node);
            this.upload.on('done', function (uploader, data) {
                  if (data && data.length && data[0].data) {
                        self.set(data[0].data);
                        self.notify();
                  }
            });

            this.node.style.display = 'block';
            if (this._listeners.length) {
                  newTag.style.cursor = 'pointer';
            }
            if (this.input) {
                  this.node.appendChild(this.input);
            }
      }
      renderIframe() {
            let
                  iframe = document.createElement('iframe');

            iframe.setAttribute('border', '0');
            iframe.src = Media.clearSource(this.media.source);
            this.replace(iframe);
      }
      static clearSource(src) {
            if(!src) {
                  return '';
            }
            return src.replace(/^\s+|\s+$|\n+|\r+/g, '');
      }
      renderVideo() {
            if (['video/youtube', 'video/vimeo'].indexOf(this.media.mime) > -1) {
                  return this.renderImage();
            }
            let
                  videoTag = document.createElement('video'),
                  alternatives = [];
            if (this.media.source) {
                  alternatives.push({
                        src: Media.clearSource(this.media.source)
                  });
            }
            if (this.media.alternatives && Array.isArray(this.media.alternatives)) {
                  alternatives = alternatives.concat(this.media.alternatives);
            }
            alternatives
                  .forEach(source => {
                        let sourceTag = document.createElement('source');
                        sourceTag.src = Media.clearSource(source.src);
                        if (source.media) {
                              sourceTag.setAttribute('media', source.media);
                        }
                        if (source.type) {
                              sourceTag.setAttribute('type', source.type);
                        }
                        videoTag.appendChild(sourceTag);
                  });

            this.replace(videoTag);
      }
      renderFile() {
            let img = document.createElement('IMG');
            img.src = 'img/cms/cms/svg/file.svg';
            this.replace(img);
      }
      renderImage() {
            let
                  img = document.createElement('IMG'),
                  src = this.media ? Media.clearSource(this.media.source) : '',
                  yt = youtube(src),
                  vm = vimeo(src);
            if (yt) {
                  src = 'https://img.youtube.com/vi/' + yt + '/maxresdefault.jpg';
                  img.setAttribute('markdown-type', 'youtube');
                  img.setAttribute('markdown-src', this.media.source);
            }
            if (vm) {
                  src = 'https://i.vimeocdn.com/video/' + vm + '_600x400.jpg';
                  img.setAttribute('markdown-type', 'vimeo');
                  img.setAttribute('markdown-src', this.media.source);
            }
            img.src = src;
            this.replace(img);
      }
      field(node, path, value) {
            let result, parts = path.split('.'),
                  element = parts.shift(),
                  field;
            if (parts.length) {
                  field = node[element];
                  if (!field) {
                        try {
                              node[element] = {};
                        } catch (e) {
                              console.error(e);
                              return;
                        }
                  }
                  return this.field(node[element], parts.join('.'), value);
            } else {
                  result = node[element] = value;
                  return result;
            }
      }
      set(media) {
            this.media = media;
            this.render();
      }
      selected(listener) {
            this._listeners.push(listener);
            this.node.style.cursor = 'pointer';
      }
      notify() {
            if (this.content) {
                  Media.manager
                        .set(this.content, this.path, this.variant, this.media ? {
                              id: this.media.id,
                              type: 'Media'
                        } : null);
            }
      }
}

lackey.Media = Media;

module.exports = Media;
