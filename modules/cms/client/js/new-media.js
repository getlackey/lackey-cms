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
    xhr = require('core/client/js/xhr'),
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
                    growl({
                        status: 'error',
                        message: 'No URL provided'
                    });
                    return;
                }
                if(!/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value)) {
                    growl({
                        status: 'error',
                        message: 'Invalid URL'
                    });
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
