/* jslint node:true, esnext:true */
/* globals LACKEY_PATH */
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

const SUtils = require(LACKEY_PATH).utils,
  _ = require('lodash'),
  SCli = require(LACKEY_PATH).cli,
  isYoutube = require('../../../shared/youtube'),
  isVimeo = require('../../../shared/vimeo'),
  treeParser = require('../../../shared/treeparser'),
  gate = require('../gate');


function print(chunk, data, type, editMode, dust, log, config) {
  let source;

  SCli.debug('lackey-cms/modules/cms/server/lib/dust/media', 'Print', JSON.stringify(data, null, 4));

  if (data && !data.content && data.default) {
    data.content = {
      source: data.default,
      type: 'image'
    };
  }

  try {
    if (data && (data.content || editMode)) {

      source = data.content ? data.content.source : null;

      if (type === 'url') {
        if (data.content.taxonomies && data.content.taxonomies.length) {
          source = gate.generateLink(config.get('salt'), 'media', data.content.id);
        }
        if (log) {
          source = dust.filters.analytics(source);
        }
        chunk.write(source);
        return;
      }

      if (type === 'id') {
        chunk.write(data.content ? data.content.id : '');
        return;
      }

      if (editMode) {
        if (type !== 'hook') {
          chunk.write('<lackey-media ');
        }
        chunk.write(' data-lky-attributes="' + JSON.stringify(data.attrs || {}).replace(/"/g, '&quot;') + '"');
        chunk.write(' data-lky-content="' + data.id + '"');
        chunk.write(' data-lky-path="' + data.path + '"');
        if (data.variant) {
          chunk.write(' data-lky-variant="' + data.variant + '"');
        }

        chunk.write(' data-lky-media="' + JSON.stringify(data.content ? (data.content.toJSON ? data.content.toJSON() : data.content) : {}).replace(/"/g, '&quot;') + '"');
        if (type === 'hook') {
          chunk.write(' data-lky-media-type="hook"');
        }

        if (type !== 'hook') {
          chunk.write('></lackey-media>');
        } else if (data.update) {
          chunk.write(' data-lky-update="' + data.update + '"');
          chunk.write(' data-lky-update-pattern="' + data.updatePattern + '"');
        }
        return;
      }

      if (type === 'hook') {
        return;
      }

      if (data.content.type === 'video') {
        chunk.write('<video');
        Object.keys(data.attrs).forEach((key) => {
          chunk.write(' ' + key + '="' + data.attrs[key].replace(/"/g, '&quot;') + '"');
        });
        chunk.write('>');

        let alternatives = [];
        if (data.content.source) {
          alternatives.push({
            src: data.content.source
          });
        }
        if (data.content.alternatives && Array.isArray(data.content.alternatives)) {
          alternatives = alternatives.concat(data.content.alternatives);
        }

        alternatives.forEach((_source) => {
          if (!_source.src) return;
          chunk.write('<source src="' + _source.src + '"');
          if (_source.media) {
            chunk.write(' media="' + _source.media + '"');
          }
          if (_source.type) {
            chunk.write(' type="' + _source.type + '"');
          }
          chunk.write('>');
        });

        chunk.write('</video>');
      } else if (data.content.type === 'image') {

        chunk.write('<img src="' + source + '"');
        if (data.attrs) {
          Object.keys(data.attrs).forEach((key) => {
            chunk.write(' ' + key + '="' + data.attrs[key].replace(/"/g, '&quot;') + '"');
          });
        }
        chunk.write('/>');
      } else if (isYoutube(data.content.source)) {
        chunk.write('<iframe type="text/html" src="https://www.youtube.com/embed/' + isYoutube(data.content.source) + '" frameborder="0"></iframe>');
      } else if (isVimeo(data.content.source)) {
        chunk.write('<iframe src="https://player.vimeo.com/video/' + isVimeo(data.content.source) + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
      } else {
        chunk.write('<a target="_blank" href="' + source + '"><img src="img/cms/cms/svg/file.svg"/></a>');
      }
    }
  } catch (e) {
    chunk.write(e.message);
  }
}

module.exports = (dust, config) => {

  dust.helpers.media = function (chunk, context, bodies, params) {

    let editMode = params.editMode,
      content = params.content,
      id = content ? content.id + '' : '',
      type = params.type,
      parent = params.parent,
      path = parent ? (parent + '.' + params.path) : params.path,
      log = !!params.analytics,
      attrNames = Object.keys(params)
      .map((name) => {
        if (name.match(/^attr-/)) {
          return name;
        }
        return null;
      })
      .filter((output) => {
        return output !== null;
      }),
      //attrs = {},
      data = treeParser.get(content ? content.layout : {}, path, params.variant, null, context.get('locale')),

      dataObject = {
        path: path,
        variant: params.variant,
        state: params.state,
        update: params.update,
        updatePattern: params.updatePattern,
        id: id,
        content: data,
        default: params.default,
        attrs: {}
      };

    attrNames.forEach((key) => {
      dataObject.attrs[key.replace(/^attr-/, '')] = params[key];
    });

    SCli.debug('lackey-cms/modules/cms/server/lib/dust/media', 'Media', JSON.stringify(data, null, 4));

    if (data && data.id) {

      SCli.debug('lackey-cms/modules/cms/server/lib/dust/media', 'Media', data.id);

      return chunk.map((injected) => {

        return SUtils.cmsMod('core')
          .model('media')
          .then((Media) => {
            return Media.findById(data.id);
          })
          .then((model) => {

            SCli.debug('lackey-cms/modules/cms/server/lib/dust/media', 'Model', model);
            if (model) {
              dataObject.content = model;
              if (model._doc.attributes) {
                _.merge(dataObject.attrs, model._doc.attributes);
              }
            }
            if (bodies.block) {
              injected.render(bodies.block, context.push(dataObject)).end();
            } else {
              print(injected, dataObject, type, editMode, dust, log, config);
            }
            injected.end();
          }, (error) => {
            injected.end(error.toString());
          })
          .catch((error) => {
            injected.end(error.toString());
          });
      });
    }
    print(chunk, dataObject, type, editMode, dust, log, config);

  };

};
