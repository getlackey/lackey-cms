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
  dom = require('prosemirror/dist/dom'),
  Inline = model.Inline,
  Attribute = model.Attribute,
  elt = dom.elt;

class Dust extends Inline {
  get attrs() {
    return {
      template: new Attribute('')
    };
  }
}

Dust.register('parseDOM', 'dust-template', {
  rank: 25,
  parse: function (domObj, state) {
    let type = domObj.getAttribute('template');
    if (!type) {
      return false;
    }
    state.insert(this, {
      type
    });
  }
});

Dust.prototype.serializeDOM = node => elt('dust-template', {
  'template': node.attrs.template
}, node.attrs.template);


Dust.register('command', 'insert', {
  derive: {
    params: [{
      label: 'Template',
      attr: 'template',
      type: 'text'
    }]
  },
  label: 'Insert dust template'
});

Dust.register('insertMenu', 'main', {
  label: 'Dust',
  command: 'insert',
  rank: 1
});

module.exports.Dust = Dust;
