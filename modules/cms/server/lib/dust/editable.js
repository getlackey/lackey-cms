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

const
  treeParser = require('../../../shared/treeparser'),
  marked = require('markdown-it');

function fromLayout(root, path, variant, locale) {

  let output = treeParser.get(root, path, variant, null, locale);

  if (!output) {
    return '';
  }

  return output;

}

const
  inline = ['h1','h2','h3','h4','h5'];

module.exports = (dust) => {

  dust.helpers.editable = function (chunk, context, bodies, params) {
    let
      editMode = params.editMode,
      content = params.content,
      id = content ? content.id + '' : '',
      layout = content ? content.layout : {},
      variant = params.variant,
      path = params.path || null,
      parent = params.parent || null,
      type = params.type || 'doc',
      def = params.default || '',
      tag = params.tag || 'div',
      locale = context.get('locale');



    if (parent) {
      path = parent + '.' + path;
    }

    chunk.write('<' + tag);

    if (editMode === true) {
      chunk.write(' data-lky-pm data-lky-content="' + id + '"');
      if (params.path) {
        chunk.write('div data-lky-path="' + path + '"');
      }
      if (params.type) {
        chunk.write(' data-lky-type="' + type + '"');
      }
      if (variant) {
        chunk.write(' data-lky-variant="' + variant + '"');
      }
    }
    layout = fromLayout(layout, path, variant, locale, type, params.route);
    chunk.write('>' + (marked[inline.indexOf(tag) !== -1 ? 'renderInline' : 'render'](layout)) + '</' + tag + '>');


    return chunk;
  };
};


module.exports.fromLayout = fromLayout;
