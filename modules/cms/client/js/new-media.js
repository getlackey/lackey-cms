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

function bytesToSize (bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
        return '0 Byte';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return parseFloat(bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function addFile (progressContainer, data) {
    var fileDiv = document.createElement('div'),
        fileFigure = document.createElement('figure'),
        fileImg = document.createElement('img'),
        fileTitle = document.createElement('p'),
        fileSize = document.createElement('span'),
        percentBar = document.createElement('div'),
        percentBarFigure = document.createElement('figure'),
        percentText = document.createElement('p'),
        dataPerSecond = document.createElement('p'),
        rightContainer = document.createElement('div'),
        stats = document.createElement('div'),
        reader = new FileReader(),
        fileType= data.file.type.split('/')[0];

    if (fileType == 'image') {
        fileFigure.appendChild(fileImg);

        reader.onload = function (e) {
            fileDiv.querySelector('figure img').src = e.target.result;
        };
        reader.readAsDataURL(data.file);
    } else {
        fileFigure.classList.add(fileType);
    }

    dataPerSecond.classList.add('bytes');
    percentBar.appendChild(percentBarFigure);
    percentBarFigure.style.width = '0%';
    percentBar.classList.add('progress-bar');
    percentText.innerHTML = '0% done';
    percentText.classList.add('percentage');
    fileTitle.innerHTML = data.file.name + ' ';
    fileSize.innerHTML = bytesToSize(data.file.size);
    fileTitle.appendChild(fileSize);
    stats.classList.add('stats');
    stats.appendChild(percentText);
    stats.appendChild(dataPerSecond);
    rightContainer.appendChild(fileTitle);
    rightContainer.appendChild(percentBar);
    rightContainer.appendChild(stats);
    fileDiv.appendChild(fileFigure);
    fileDiv.appendChild(rightContainer);

    fileDiv.setAttribute('id', data.guid);
    fileDiv.setAttribute('data-time', new Date().getTime() / 1000);
    fileDiv.setAttribute('data-percent', 0);

    progressContainer.appendChild(fileDiv);
}

function onProgress (data) {
    let guid = data.guid,
        percent = Math.round(data.percent),
        fileDiv = document.getElementById(guid),
        bytesPerSecond = (((data.percent - fileDiv.getAttribute('data-percent')) / 100) * data.file.size) * (1 / ((new Date().getTime() / 1000) - fileDiv.getAttribute('data-time')));

    fileDiv.setAttribute('data-time', new Date().getTime() / 1000);
    fileDiv.setAttribute('data-percent', data.percent);
    fileDiv.querySelector('.progress-bar figure').style.width = percent + '%';
    fileDiv.querySelector('p.percentage').innerHTML = (percent == 100) ? 'Completed' : percent + '% done';
    fileDiv.querySelector('p.bytes').innerHTML = (percent == 100) ? '' : bytesToSize(bytesPerSecond) + '/sec';
}

module.exports = function (el, cb) {
    var media,
        dragdrop,
        root = el || document,
        callback = cb || function () {},
        progressContainer = el.querySelector('.progress-container');

    lackey
        .select('[data-tab-nav]', root)
        .forEach((element) => {
            element.addEventListener('click', (e) => {
                e.preventDefault();

                let tab = document.querySelector('[data-tab=' + element.getAttribute('href') + ']');

                lackey
                    .select('[data-tab-nav]', root)
                    .forEach((element) => {
                        element.removeAttribute('data-active');
                    });

                lackey
                    .select('[data-tab]', root)
                    .forEach((element) => {
                        element.style.display = 'none';
                    });
                tab.style.display = 'block';
                element.setAttribute('data-active', '');
            });
        });

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

            media.upload.on('fileAdded', function (uploader, data) {
                addFile(progressContainer, data);
            });

            media.upload.on('data', function (uploader, data) {
                onProgress(data);
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
    dragdrop.on('data', function (uploader, data) {
        onProgress(data);
    });

    dragdrop.on('fileAdded', function (uploader, data) {
       addFile(progressContainer, data);
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
