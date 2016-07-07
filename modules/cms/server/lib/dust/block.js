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
const SCli = require(LACKEY_PATH).cli,
  SUtils = require(LACKEY_PATH).utils,
  treeParser = require('../../../shared/treeparser');

module.exports = (dust) => {

  dust.helpers.block = function (chunk, context, bodies, params) {
    SCli.debug('lackey-cms/modules/cms/server/lib/dust/block');

    let data = context,
      paramsCopy = JSON.parse(JSON.stringify(params)),
      layer;

    Object
      .keys(params)
      .forEach((key) => {
        let match = key.match(/^data-(.+)$/);
        if (match) {
          layer = layer || {};
          layer[match[1]] = params[key];
        }
      });

    if (layer) {
      data = data.push(layer);
    }

    return chunk.map((injectedChunk) => {
      module.exports.block(
        paramsCopy.content ? treeParser.get(params.content.layout, params.path) : {
          template: params.template,
          route: params.route
        },
        injectedChunk, data, bodies, paramsCopy, dust, params.content ? params.content.id : null
      ).then(() => {
        injectedChunk.end();
      }, (error) => {
        dust.helpers.error(injectedChunk, error);
        console.error(error, error.stack);
        injectedChunk.end();
      });
    });
  };

};

module.exports.block = (config, injectedChunk, context, bodies, params, dust) => {

  SCli.debug('lackey-cms/modules/cms/server/lib/dust/block');

  if (!config) {
    return Promise.resolve(injectedChunk);
  }

  return new Promise((resolve, reject) => {

    SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'inner');

    let promise = Promise.resolve(),
      data = context,
      route = config.route,
      document,
      template = params.template || config.template;

    //data = data.push(params);

    if (config.props) {
      SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'has props');
      let props = {};
      Object.keys(config.props).forEach((key) => {
        let val = config.props[key];
        if (!(typeof config.props[key] === 'string' && val.replace(/\s+/g, '') === '')) {
          props[key] = val;
        }
      });
      route = route || config.props.route;
      data = data.push(props);
    }


    if (route) {
      SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'has route');
      promise = promise
        .then(() => {
          return SUtils.cmsMod('core').model('content');
        })
        .then((Content) => {
          return Content.findByRoute(route);
        })
        .then((content) => {
          if (!content) {
            throw new Error('No referred document found ' + route);
          }
          SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'found content');
          document = content;
          data = data.push({
            data: {
              path: '',
              content: content.toJSON()
            }
          });
        });
    } else {
      SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'has no route');
      data = data.push({
        path: params.path + '.fields'
      });
    }

    if (!template && promise.route) {
      SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'no template and route');
      promise = promise.then(() => {
        if (!document) {
          return;
        }
        return require('../../models/template')
          .then((Template) => {
            return Template.findById(document._doc.templateId);
          })
          .then((templateObj) => {
            if (templateObj) {
              SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'got template from route');
              template = templateObj.path;
            }
          });
      });
    }

    promise.then(() => {
      SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'last steps');
      if (!template) {
        SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'no template');
        return resolve(injectedChunk);
      }

      SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'rendering');
      dust.render(template, data, (err, out) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        injectedChunk.write(out);
        SCli.debug('lackey-cms/modules/cms/server/lib/dust/block', 'Rendered ');
        resolve(injectedChunk);
      });

    }, (error) => {
      reject(error);
    });


  });

};
