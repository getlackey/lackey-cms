/* eslint no-cond-assign:0, no-alert:0 */
/* jslint browser:true, node:true, esnext:true */
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
const
    lackey = require('core/client/js'),
    api = require('core/client/js/api'),
    growl = require('cms/client/js/growl'),
    Media = require('cms/client/js/media'),
    Upload = require('core/client/js/upload');

module.exports = function (el, cb) {
    var media,
        dragdrop,
        root = el || document,
        callback = cb || function () {};

    lackey
        .select('[data-lky-media]', root)
        .forEach((element) => {
            media = new Media(element);

            media.input.addEventListener('change', function (event) {
                media.upload.choice(event);
            });

            document.querySelector('#fileIn').addEventListener('click', function () {
                media.input.click();
            });

            media.upload.on('done', function (uploader, data) {
                if (data && data.length && data[0].data) {
                    media.set(data[0].data);
                    media.notify();

                    growl({
                        status: 'success',
                        message: 'File successfully uploaded'
                    });
                    callback(data[0].data);
                }
            });
        });

    dragdrop = new Upload(document.querySelector('#imageDrop'));
    dragdrop.on('done', function (uploader, data) {
          if (data && data.length && data[0].data) {
                media.set(data[0].data);
                media.notify();
                growl({
                    status: 'success',
                    message: 'File successfully uploaded'
                });
                callback(data[0].data);
          }
    });

    lackey
        .select('[data-lky-hook="url.upload"]', root)
        .forEach(element => {
            element.addEventListener('submit', (event) => {
                event.preventDefault();
                let value = element.querySelector('input[name=urlUpload]').value;
                if (!value) {
                    return;
                }
                api
                    .create('/cms/media', {
                        source: value
                    })
                    .then(() => {
                        growl({
                            status: 'success',
                            message: 'Asset successfully added'
                        });
                    });
            }, true);
        });
};
