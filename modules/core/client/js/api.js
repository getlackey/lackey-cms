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

const xhr = require('core/client/js/xhr');

function parse(data, readAs, asError) {
  console.log(data);
  let format = readAs || 'json';
  if (data === null || data === undefined) {
    if (asError) {
      throw new Error(null);
    }
    return null;
  }
  switch (format) {
    default: {
      if (asError) {
        let innerData = JSON.parse(data.data);
        if (typeof innerData.data === 'string') {
          throw new Error(innerData.data);
        }
        throw data;
      }
      return JSON.parse(data);
    }
  }
}


module.exports = {
  read: function (path, readAs) {
    return xhr
      .basedGet('/api' + path)
      .then(response => parse(response, readAs), response => parse(response, readAs, true));
  },
  create: function (path, data, readAs) {
    return xhr
      .basedPost('/api' + path, data)
      .then(response => parse(response, readAs), response => parse(response, readAs, true));
  },
  update: function (path, data, readAs) {
    return xhr
      .basedPut('/api' + path, data)
      .then(response => parse(response, readAs), response => parse(response, readAs, true));
  },
  delete: function (path, readAs) {
    return xhr
      .basedDelete('/api' + path)
      .then(response => parse(response, readAs), response => parse(response, readAs, true));
  }
};
