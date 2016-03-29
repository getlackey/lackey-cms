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
  editable = require('./editable'),
  escape = require('escape-html');


module.exports = (dust) => {

  dust.helpers.attr = function (chunk, context, bodies, params) {
    let
      content = params.content,
      field = params.field || false,
      layout = content.layout,
      variant = params.variant,
      type = params.type || 'doc';

    try {
      if (layout && layout.type) {
        chunk.write(escape(editable.fromLayout(layout, params.path, field, variant, type, params.path, 'text').replace(/\n/g, ' ')));
      }
    } catch (error) {
      throw error;
    }

    return chunk;
  };

};
