/* jslint node:true, esnext: true */
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
  inputrules = require('prosemirror/dist/inputrules'),
  Inline = model.Inline,
  Attribute = model.Attribute,
  elt = dom.elt,
  InputRule = inputrules.InputRule,
  dinos = ['brontosaurus', 'stegosaurus', 'triceratops', 'tyrannosaurus', 'pterodactyl'];

class Dino extends Inline {
  get attrs() {
    return {
      type: new Attribute('brontosaurus')
    };
  }
}

Dino.register('parseDOM', 'img', {
  rank: 25,
  parse: function (domObj, state) {
    let type = domObj.getAttribute('dino-type');
    if (!type) {
      return false;
    }
    state.insert(this, {
      type
    });
  }
});

Dino.prototype.serializeDOM = node => elt('img', {
  'dino-type': node.attrs.type,
  class: 'dinosaur',
  src: '/img/cms/cms/' + node.attrs.type + '.png',
  title: node.attrs.type
});

// FIXME restore icon-based selection
const dinoOptions = dinos.map(name => ({
  value: name,
  label: name
}));

Dino.register('command', 'insert', {
  derive: {
    params: [{
      label: 'Type',
      attr: 'type',
      type: 'select',
      options: dinoOptions,
      default: dinoOptions[0]
    }]
  },
  label: 'Insert dino'
});

Dino.register('insertMenu', 'main', {
  label: 'Dino',
  command: 'insert',
  rank: 1
});

let inputRule = new InputRule(new RegExp('\\[(' + dinos.join('|') + ')\\]$'), ']', function (pm, match, pos) {
  let start = pos.move(-match[0].length);
  pm.tr.delete(start, pos).insertInline(start, this.create({
    type: match[1]
  })).apply();
});

Dino.register('autoInput', 'autoDino', inputRule);

module.exports.dinos = dinos;
module.exports.Dino = Dino;
