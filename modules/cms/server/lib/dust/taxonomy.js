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

module.exports = (dust) => {

  dust.helpers.taxonomy = function (chunk, context, bodies, params) {
    let data = context.get('data'),
      name = params.name,
      type = params.type,
      many = !!params.many,
      newContext,
      taxonomies = [],
      post = context.get('post') || {};

    if (post.preview) {
        post.preview = JSON.parse(post.preview);
    }

    if (type) {
      let found = false;
      if (data.content) {
        taxonomies = data.content.taxonomies || [];
        if (post.preview && post.preview.contents.taxonomies) {
          taxonomies = post.preview.contents.taxonomies;
        }
      }
      if (data && data.content && data.content.template && data.content.template.taxonomies) {
        taxonomies = taxonomies.concat(data.content.template.taxonomies);
      }
      (taxonomies).forEach((taxonomy) => {
        if (!found && name) {
          if (taxonomy.name === name && taxonomy.type.name === type) {
            chunk.render(bodies.block, context);
            if (!many) {
              found = true;
            }
          }
        } else if (!found && taxonomy.type.name === type) {
          newContext = context.push({
            $taxonomy: taxonomy
          });
          chunk.render(bodies.block, newContext);
          if (!many) {
            found = true;
          }
        }
      });
      if (!found && bodies.else) {
        chunk.render(bodies.else, context);
      }
    }

    return chunk;
  };

};
