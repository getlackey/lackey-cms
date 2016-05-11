/* jslint node:true, esnext:true */
/* eslint no-param-reassign:0 */
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
  editable = require('./editable'),
  escape = require('escape-html');


module.exports = (dust) => {

  dust.helpers.hasContent = function (chunk, context, bodies, params) {
    let
      content = params.content,
      field = params.field || false,
      layout = content.layout,
      variant = params.variant,
      type = params.type || 'doc',
      path = params.path || '',
      parent = params.parent || null;

    if (parent) {
      path = parent + '.' + path;
    }
    try {
      if (layout && layout.type) {
        layout = escape(editable.fromLayout(layout, path, field, variant, type, path, 'text').replace(/\n/g, ' '));
      }
    } catch (error) {
      throw error;
    }

    if (params.editMode || (layout && layout.replace(/\s+/g, '').length)) {
      if (bodies.block) {
        chunk = chunk.render(bodies.block, context);
      }
    } else if (bodies.else) {
      chunk = chunk.render(bodies.else, context);
    }

    return chunk;
  };

};
