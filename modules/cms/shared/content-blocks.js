/* jslint node:true, esnext:true, browser:true */
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
      dust = require('./widgets/dust'),
      twitterable = require('./widgets/twitterable'),
      command = require('prosemirror/dist/edit/command'),
      selectedNodeAttr = command.selectedNodeAttr,
      iframe = require('./widgets/iframe').iframe,
      Twitterable = twitterable.Twitterable,
      format = require('prosemirror/dist/format'),
      toText = format.toText,
      Dust = dust.Dust,
      Image = model.Image;

let img = window.document.createElement('img');
img.style.left = '-1000px';
img.style.top = '-1000px';

Image.register('command', 'insert', {
      label: 'Upload Image',
      menu: {
            group: 'insert',
            rank: 20,
            display: {
                  type: 'label',
                  label: 'Image / Video'
            }
      },
      select: this.isInline ? function (pm) {

            return pm.doc.resolve(pm.selection.from).parent.type.canContainType(this);
      } : null,
      run: function (pm) {
            let self = this;
            top.LackeyManager.stack
                  .inspectMedia(null, img)
                  .then((result) => {
                        if (result || result === -1) {
                              if (!result) return;

                              let alt = result.alt || selectedNodeAttr(pm, self, 'alt') || toText(pm.doc.cut(pm.selection.from, pm.selection.to)),
                                    image = this.create({
                                          alt: alt,
                                          title: alt,
                                          src: result.source
                                    });
                              pm.tr.replaceSelection(image).apply(pm.apply.scroll);
                        }
                  });


      }
});

let LackeySchema = new Schema(defaultSchema.spec.update({
      dust: Dust,
      twitterable: Twitterable,
      iframe: iframe,
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
