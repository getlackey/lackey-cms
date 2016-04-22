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

const format = require('prosemirror/dist/format'),
  parseFrom = format.parseFrom,
  atomus = require('atomus'),
  toHTML = format.toHTML,
  toText = format.toText,
  treeParser = require('../../../shared/treeparser'),
  BbPromise = require('bluebird');

let LackeySchema,
  HeadingSchema;

function schema(type) {
  switch (type) {
  case 'heading':
    return HeadingSchema;
  default:
    return LackeySchema;
  }
}

function fromLayout(root, path, variant, locale, type, route, toFormat) {

  let output = treeParser.get(root, path, variant, null, locale);

  if (!output) {
    return '';
  }

  try {
    output = treeParser.walk(parseFrom(schema(type), output, 'json'));
    output = (toFormat === 'text' ? toText : toHTML)(output, {
      serverSide: true,
      uri: route
    });
  } catch (e) {
    output = e.message;
  }
  return output;

}

module.exports = (dust) => {

  dust.helpers.editable = function (chunk, context, bodies, params) {
    let editMode = params.editMode,
      content = params.content,
      id = content ? content.id + '' : '',
      layout = content ? content.layout : {},
      variant = params.variant,
      path = params.path || null,
      parent = params.parent || null,
      type = params.type || 'doc',
      locale = context.get('locale');

    if (parent) {
      path = parent + '.' + path;
    }
    if (editMode === true) {
      chunk.write('<div data-lky-pm data-lky-content="' + id + '"');
      if (params.path) {
        chunk.write('div data-lky-path="' + path + '"');
      }
      if (params.type) {
        chunk.write(' data-lky-type="' + type + '"');
      }
      if (variant) {
        chunk.write(' data-lky-variant="' + variant + '"');
      }
      chunk.write('></div>');
    } else {
      try {

        if (layout && layout.type) {
          layout = fromLayout(layout, path, variant, locale, type);

          let regexMulti = /<dust-template(.+?)template=('|")(.*?)('|")(.+?)<\/dust-template>/g,
            regexSingle = /<dust-template(.+?)template=('|")(.*?)('|")(.+?)<\/dust-template>/,
            matches = layout.match(regexMulti);
          if (!matches || matches.length === 0) {
            return chunk.write(layout);
          } else {
            return chunk.map((injectedChunk) => {
              BbPromise.all(matches.map((match) => {
                let innerMatches = match.match(regexSingle);
                return new BbPromise((resolve) => {
                  dust.render(innerMatches[3], context, (error, result) => {
                    if (error) {
                      return resolve({
                        original: match,
                        replace: error.message
                      });
                    }
                    resolve({
                      original: match,
                      replace: result
                    });
                  });
                });
              })).then((results) => {
                results.forEach((result) => {
                  layout = layout.replace(result.original, result.replace);
                });
                injectedChunk.write(layout);
                injectedChunk.end();
              }, (error) => {
                throw error;
              });
            });
          }
        } else {
          return chunk;
        }
      } catch (error) {
        throw error;
      }
    }

    return chunk;
  };

};

module.exports.fromLayout = fromLayout;

module.exports.browser = new BbPromise((resolve, reject) => {

  atomus().html('<html></html>').ready(function (errors, window) {
    try {
      if (errors) {
        return reject(errors);
      }
      GLOBAL.window = window;
      GLOBAL.navigator = window.navigator;
      GLOBAL.document = window.document;
      LackeySchema = require('../../../shared/content-blocks').LackeySchema;
      HeadingSchema = require('../../../shared/inline');
      window.LackeySchema = LackeySchema;
      resolve(window);
    } catch (err) {
      return reject(err);
    }
  });
});
