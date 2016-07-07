/* jslint node:true, esnext:true */
/* global LACKEY_PATH */
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


const path = require('path'),
    SUtils = require(LACKEY_PATH).utils,
    SCli = require(LACKEY_PATH).cli,
    mime = require('mime'),
    media = require('./index'),
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/media/sockets';

let files = {};

function postProcess(file, config) {
    SCli.log(__MODULE_NAME, 'Post process', file);
    let oldPath = file.path;
    return new Promise((resolve) => {
            resolve(mime.lookup(file.path));
        })
        .then((mimeType) => {
            SCli.log(__MODULE_NAME, 'Post process - mime', mime);
            file.mime = mimeType;
            let uploadSettings = config.get('upload');
            if (uploadSettings) {
                SCli.log(__MODULE_NAME, 'S3 uploadeding');
                return SUtils
                    .s3PutObject(file.path, file.mime, uploadSettings)
                    .then((newLocation) => {
                        SCli.log(__MODULE_NAME, 'S3 uploaded');
                        file.path = newLocation;
                        return SUtils.rimraf(path.dirname(oldPath));
                    });
            }
            return;
        })
        .then(() => {
            return media;
        })
        .then((Media) => {
            SCli.log(__MODULE_NAME, 'Create recode');
            let filePath = file.path.match(/^http(|s):\/\//) ? file.path : '/' + path.relative(SUtils.getProjectPath(), file.path);
            if (file.ju) {
                return filePath;
            }
            return (new Media({
                    name: path.basename(file.path),
                    mime: file.mime,
                    source: filePath,
                    alternatives: []
                }))
                .save()
                .then((medium) => {
                    SCli.log(__MODULE_NAME, 'Done in fact');
                    return medium.toJSON();
                });

        })
        .catch((error) => {
            console.error(error);
        });
}

module.exports = (socket, config) => {


    socket.on('media.start-upload', (data) => {

        SCli.log(__MODULE_NAME, 'media.start-upload');

        let now = new Date(),
            name = data.name,
            guid = data.guid,
            place,
            filePath = SUtils.getProjectPath() + 'uploads/' + now.getFullYear() + '/' + now.getMonth() + '/' + guid + '/' + name,
            file = files[guid] = {
                fileSize: data.size,
                data: '',
                downloaded: 0,
                path: filePath,
                ju: !!data.ju
            };

        SCli.log(__MODULE_NAME, 'media.start-upload - mkdir');

        SUtils
            .mkdir(path.dirname(filePath))
            .then(() => {
                SCli.log(__MODULE_NAME, 'media.start-upload - stats');
                return SUtils.stats(filePath);
            })
            .then((stat) => {
                if (stat && stat.isFile()) {
                    SCli.log(__MODULE_NAME, 'media.start-upload - append');
                    file.downloaded = stat.size;
                    place = stat.size / 524288;
                } else {
                    SCli.log(__MODULE_NAME, 'media.start-upload - new file');
                }
                return SUtils.open(filePath, 'a', 777);
            })
            .then((handler) => {
                SCli.log(__MODULE_NAME, 'media.start-upload - has handler');
                file.handler = handler;
                socket.emit('media.more-data', {
                    place: place,
                    percent: 0,
                    guid: guid
                });
            })
            .catch((error) => {
                console.error(error);
            });
    });


    function progress(file, guid) {

        SCli.log(__MODULE_NAME, 'progress');

        let place = file.downloaded / 524288,
            percent = file.downloaded / file.fileSize * 100,
            done = file.downloaded === file.fileSize;

        if (done) {
            SCli.log(__MODULE_NAME, 'progress - done');
            return SUtils
                .close(file.handler)
                .then(() => {
                    SCli.log(__MODULE_NAME, 'progress - close');
                    file.handler = null;
                    return postProcess(file, config);
                })
                .then((response) => {
                    SCli.log(__MODULE_NAME, 'progress - post process done');
                    socket.emit('media.uploaded', {
                        guid: guid,
                        data: response,
                        place: place,
                        percent: percent,
                        downloaded: file.downloaded,
                        size: file.fileSize
                    });
                }, (err) => {
                    console.error(err);
                })
                .catch((error) => {
                    console.error(error);
                });

        }
        socket.emit('media.more-data', {
            place: place,
            percent: percent,
            downloaded: file.downloaded,
            size: file.fileSize,
            guid: guid
        });
    }

    socket.on('media.upload', (data) => {

        SCli.log(__MODULE_NAME, 'media.upload');

        try {
            let guid = data.guid,
                file = files[guid];

            file.downloaded += data.data.length;
            file.data += data.data;

            if (file.downloaded === file.fileSize) {
                SCli.log(__MODULE_NAME, 'progress - write');
                return SUtils
                    .write(file.handler, file.data, 'binary', null)
                    .then((err) => {
                        if (err) {
                            console.error(err);
                        }
                        delete files[guid];
                        progress(file, guid);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
            progress(file, guid);
        } catch (error) {
            console.error(error);
            console.error(error.stack);
        }
    });
};
