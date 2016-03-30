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
const model = require('prosemirror/dist/model'),
      Schema = model.Schema,
      defaultSchema = model.defaultSchema,
      dino = require('./widgets/dino'),
      dust = require('./widgets/dust'),
      twitterable = require('./widgets/twitterable'),
      Dino = dino.Dino,
      Twitterable = twitterable.Twitterable,
      Dust = dust.Dust,
      Image = model.Image;

let img = window.document.createElement('img');
img.style.left = '-1000px';
img.style.top = '-1000px';

Image.register('command', 'upload', {
      label: 'Upload Image',
      menu: {
            group: 'insert',
            rank: 70,
            display: {
                  type: 'label',
                  label: 'Media'
            }
      },
      run: function (pm) {
            top.Lackey.manager.media({
                        node: img
                  })
                  .then((media) => {
                        if (!media) return;
                        pm.execCommand('image:insert', [media.source, media.source, media.source]);
                  });
      }
});

let LackeySchema = new Schema(defaultSchema.spec.update({
      dust: Dust,
      twitterable: Twitterable,
      dino: Dino,
      image: Image
}));

LackeySchema.newDoc = (id) => {
      let block = {
            type: 'doc',
            content: [{
                  type: 'paragraph',
                  content: []
            }]
      };
      if (id) {
            block.id = id;
      }
      return block;
};

module.exports.LackeySchema = LackeySchema;
