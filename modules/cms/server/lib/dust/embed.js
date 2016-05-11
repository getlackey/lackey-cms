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
const SCli = require(LACKEY_PATH).cli,
  SUtils = require(LACKEY_PATH).utils;

module.exports = (dust) => {

  dust.helpers.embed = function (chunk, context, bodies, params) {

    let
      route = params.route + '',
      template = params.template || false,
      data = context,
      type = params.type || 'page';

    SCli.debug('lackey-cms/modules/cms/serer/lib/dust/embed', route, template);

    return chunk.map((injectedChunk) => {
      SCli.debug('lackey-cms/modules/cms/serer/lib/dust/embed', 'map', route, template);
      return SUtils
        .cmsMod('core')
        .model('content')
        .then((Content) => {
          SCli.debug('lackey-cms/modules/cms/serer/lib/dust/embed', 'query', route, template);
          return Content.getByTypeAndRoute(type, route);
        })
        .then((document) => {
          if (!document) {
            SCli.debug('lackey-cms/modules/cms/serer/lib/dust/embed', 'No content', route, template);
            if (bodies.error) {
              injectedChunk.render(bodies.error, data.push(params).push({
                error: new Error('Route ' + route + ' not found')
              }));
            } else {
              dust.helpers.error(injectedChunk, 'Route ' + route + ' not found', null);
            }

            injectedChunk.end();
            return injectedChunk;
          }

          function render() {

            SCli.debug('lackey-cms/modules/cms/serer/lib/dust/embed', 'Content', route, template);
            data = data
              .push({
                data: {
                  content: document.toJSON()
                }
              })
              .push(params);


            dust.render(template, data, (err, out) => {
              if (err) {
                SCli.debug('lackey-cms/modules/cms/serer/lib/dust/embed', 'Error', route, template);
                if (bodies.error) {
                  injectedChunk.render(bodies.error, data.push({
                    error: err
                  }));
                } else {
                  dust.helpers.error(injectedChunk, err, null, err);
                }
                return injectedChunk.end();
              }

              injectedChunk.write(out);
              SCli.debug('lackey-cms/modules/cms/serer/lib/dust/embed', 'Rendered ', route, template);
              injectedChunk.end();
              return injectedChunk;
            });
          }

          if (template || !document._doc.templateId) {
            return render();
          }
          require('../../models/template')
            .then((Template) => {
              return Template.findById(document._doc.templateId);
            })
            .then((templateObj) => {
              if (templateObj) {
                template = templateObj.path;
              }
              render();
            });
        }, (error) => {
          SCli.debug('lackey-cms/modules/cms/serer/lib/dust/embed', 'Error', route, template);
          if (bodies.error) {
            injectedChunk.render(bodies.error, data.push({
              error: error
            }));
          } else {
            dust.helpers.error(injectedChunk, error, null, error);
          }
          return injectedChunk.end();
        });
    });

  };

};
