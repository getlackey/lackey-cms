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

module.exports = (dust, config) => {
  dust.filters.base = (value) => module.exports.base(config.get('host'), value);

  function renderBlock(block, chunk, context) {
    var output = '';
    chunk.tap(function (data) {
      output += data;
      return '';
    }).render(block, context).untap();
    return output;
  }

  dust.helpers.base = (chunk, context, bodies) => {
    let content = renderBlock(bodies.block, chunk, context);
    return chunk.write(module.exports.base(config.get('host'), content));
  };

  dust.filters.addSlash = module.exports.addSlash;
};

module.exports.base = function (host, value) {

  if (value && value.match(/^[a-zA-Z0-9]+\:\/\//)) {
    return value;
  }

  let base = host.replace(/\/$/, ''),
    val = value ? value.replace(/^\//, '') : '';

  return base + '/' + val;
};

module.exports.addSlash = function (value) {
  let result = value.replace(/^\s+|\s+$/g, '');
  if (result && result[result.length - 1] !== '/') {
    result += '/';
  }
  return result;
};
