/* jslint node:true */
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

const xhr = require('../../../core/client/js/xhr');

function parse(data, readAs) {
  let format = readAs || 'json';
  if (data === null || data === undefined) {
    return null;
  }
  switch (format) {
    default: {
      return JSON.parse(data);
    }
  }
}

module.exports = {
  read: function (path, readAs) {
    return xhr.get('/api' + path).then((response) => parse(response, readAs));
  },
  create: function (path, data, readAs) {
    return xhr.post('/api' + path, data).then((response) => parse(response, readAs));
  },
  update: function (path, data, readAs) {
    return xhr.put('/api' + path, data).then((response) => parse(response, readAs));
  },
  delete: function (path, readAs) {
    return xhr.delete('/api' + path).then((response) => parse(response, readAs));
  }
};
