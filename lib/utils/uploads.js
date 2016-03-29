/* jslint esnext:true, node:true */
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
const fs = require('fs'),
  BbPromise = require('bluebird'),
  SUtils = require('./index'),
  configuration = require('./../configuration'),
  mkdirp = require('mkdirp'),
  SCli = require('./cli'),
  path = require('path');


function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

function save(buffer, headers) {

  let size = headers['x-file-size'],
    name = headers['x-file-name'] || 'uploads',
    mime = headers['x-file-type'],
    now = new Date();

  SCli.debug('lackey-cms/lib/utils/upload', 'SAVE');

  return configuration().then((config) => {


    if (name.match(/\.\./)) {
      SCli.debug('lackey-cms/lib/utils/upload', 'WRONG NAME');
      throw new Error('Wrong name');
    }

    if (!buffer.length) {
      SCli.debug('lackey-cms/lib/utils/upload', 'NO DATA');
      throw new Error('No data');
    }

    name = SUtils.getProjectPath() + 'uploads/' + config.get('site') + '/' + now.getFullYear() + '/' + now.getMonth() + '/' + name;

    name = path.resolve(name);

    return new BbPromise((resolve, reject) => {

      mkdirp(path.dirname(name), (error) => {
        if (error) {
          SCli.debug('lackey-cms/lib/utils/upload', 'MKDIR ERROR');
          /* istanbul ignore next : external */
          return reject(error);
        }
        fs.exists(name, (exists) => {
          if (exists) {
            let ext = path.extname(name);
            name = name.replace(new RegExp(ext + '$'), '');
            name += '.' + now.getTime() + ext;
          }
          fs.writeFile(name, buffer, (error2) => {
            if (error2) {
              SCli.debug('lackey-cms/lib/utils/upload', 'WRITE FILE ERROR');
              /* istanbul ignore next : external */
              return reject(error2);
            }
            resolve({
              name: name,
              mime: mime,
              size: size,
              source: {
                src: 'uploads/' + (path.relative(SUtils.getProjectPath() + 'uploads/' + config.get('site') + '/', name))
              }
            });
          });
        });
      });

    });
  });
}

module.exports = {
  save: save
};
