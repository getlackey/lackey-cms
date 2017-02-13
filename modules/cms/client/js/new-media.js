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
    userDrop = require('cms/client/js/manager/user.dropdown.js'),
    Upload = require('core/client/js/upload');


var media,
    dragdrop;

userDrop();
lackey
    .select('[data-lky-media]').forEach((element) => {
        media = new Media(element);
        console.log('test');
        let src = media.node.getAttribute('src');

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
      }
});
window.dragdrop = dragdrop;
