/* jslint node:true, esnext:true */
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
if (!GLOBAL.LACKEY_PATH) {
  /* istanbul ignore next */
  GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const SUtils = require(LACKEY_PATH).utils,
  SCli = require(LACKEY_PATH).cli,
  treeParser = require('../../../shared/treeparser');


function print(chunk, data, type, editMode, dust) {
  let sources;

  if (data && data.content) {

    sources = data.content.sources;

    if (!sources) return;

    if (type === 'url') {
      chunk.write(sources.src);
      return;
    } else if (type === 'hook') {
      chunk.write('data-lky-image ');
      return;
    }


    if (data.content.type === 'video') {
      chunk.write('<video controls>');
      sources.forEach((source) => {
        chunk.write('<source src="' + source.src + '"');
        if (source.media) {
          chunk.write(' media="' + source.media + '"');
        }
        if (source.type) {
          chunk.write(' type="' + source.type + '"');
        }
        chunk.write('>');
      });
      chunk.write('</video>');
      return;
    }



    chunk.write('<img src="' + sources.src + '"');
    if (sources.srcset) {
      chunk.write(' srcset="' + sources.srcset + '"');
    }
    if (editMode) {
      chunk.write(' data-lky-content="' + data.id + '"');
      chunk.write(' data-lky-path="' + data.path + '"');
      chunk.write(' data-lky-image="' + JSON.stringify(data.content.toJSON()).replace(/"/g, '&quot;') + '"');
    }
    chunk.write('/>');
  }

}

module.exports = (dust) => {

  dust.helpers.media = function (chunk, context, bodies, params) {

    let editMode = params.editMode,
      content = params.content,
      id = content ? content.id + '' : '',
      type = params.type,
      parent = params.parent,
      path = parent ? (parent + '.' + params.path) : params.path,

      data = treeParser.get(content ? content.layout : {}, path, params.variant),
      dataObject = {
        path: path,
        id: id,
        content: data,
        default: params.default
      };

    SCli.debug('lackey-cms/modules/cms/server/lib/dust/media', 'Media', JSON.stringify(data, null, 4));

    if (data && data.id) {

      SCli.debug('lackey-cms/modules/cms/server/lib/dust/media', 'Media', data.id);

      return chunk.map((injected) => {

        return SUtils.cmsMod('media').model('media')
          .then((Media) => {
            return Media.findById(data.id);
          }).then((model) => {

            SCli.debug('lackey-cms/modules/cms/server/lib/dust/media', 'Model', model);
            if (model) {
              dataObject.content = model;
            }
            print(injected, dataObject, type, editMode, dust);
            injected.end();
          }, (error) => {
            injected.end(error.toString());
          });
      });
    }
    print(chunk, dataObject, type, editMode, dust);

  };

};
