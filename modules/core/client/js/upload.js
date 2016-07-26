/* jslint node:true, esnext: true, browser:true, -W083:0 */
'use strict';
/*
    Copyright 2016 Enigma Marketing Services Limited

    Licensed under the Apache License, Version 2.0 (the 'License');
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an 'AS IS' BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

const
    guid = require('guid'),
    socket = require('core/client/js/socket');

if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    console.error('Upload not supported');
    return;
}

function Upload(HTMLElement, onClick, justUpload) {
    this._listeners = {};
    this._ju = !!justUpload;
    this.input(HTMLElement, onClick);
}

Upload.prototype.browse = function (event) {
    event.preventDefault();
};

Upload.prototype.input = function (HTMLElement, onClick) {

    this._hover = this.hover.bind(this);
    this._drop = this.drop.bind(this);
    this._pick = this.pick.bind(this);

    HTMLElement.addEventListener('dragover', this._hover, false);
    HTMLElement.addEventListener('dragleave', this._hover, false);
    HTMLElement.addEventListener('drop', this._drop, false);

    if (onClick) {
        var input = document.createElement('input');
        input.type = 'file';
        input.setAttribute('multiple', 'false');
        input.style.position = 'fixed';
        input.style.left = '-1000px';
        input.addEventListener('change', this._pick, false);

        HTMLElement.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            if (event.target.nodeName === 'INPUT') {
                return;
            }
            if (document.createEvent) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                input.dispatchEvent(evt);
            } else {
                input.fireEvent('onclick'); //For IE
            }
        }, true);
    }

    this.element = HTMLElement;
};

Upload.prototype.pick = function (event) {
    this.hover(event);
    this.choice(event);
};

Upload.prototype.hover = function (event) {
    event.stopPropagation();
    event.preventDefault();
    event.target.className = (event.type === 'dragover' ? 'hover' : '');
};

Upload.prototype.drop = function (event) {
    this.hover(event);
    this.choice(event);
};

Upload.prototype.on = function (eventName, listener) {
    if (!this._listeners[eventName]) {
        this._listeners[eventName] = [];
    }
    this._listeners[eventName].push(listener);
};

Upload.prototype.emit = function (eventName, data) {
    var self = this;
    if (this._listeners[eventName]) {
        this._listeners[eventName].forEach(function (listener) {
            listener(self, data);
        });
    }
};

let filesToUpload = {};

socket.on('media.more-data', (data) => {
    var def = filesToUpload[data.guid],
        file = def.file,
        place = (isNaN(data.place) ? 0 : data.place) * 524288,
        newFile = file.slice(place, place + Math.min(524288, (file.size - place)));
    def.reader.readAsBinaryString(newFile);
});

socket.on('media.uploaded', (data) => {
    var def = filesToUpload[data.guid];
    delete filesToUpload[data.guid];
    def.resolve(data);
});

Upload.prototype.destroy = function () {
    this.element.removeEventListener('dragover', this._hover, false);
    this.element.removeEventListener('dragleave', this._hover, false);
    this.element.removeEventListener('drop', this._drop, false);
    this.element = null;
    this._listeners = null;
};

Upload.prototype.choice = function (event) {

    var self = this,
        files1 = Array.prototype.slice.apply(event.target.files || []),
        files2 = Array.prototype.slice.apply(event.dataTransfer ? event.dataTransfer.files || [] : []);

    this.files = files1.concat(files2);

    var promise = Promise.resolve(),
        next = this.files.shift(),
        uploaded = [];
    while (next) {
        promise = promise.then((function (file) {
            return function () {
                return new Promise(function (resolve, reject) {
                        var FReader = new FileReader(),
                            name = file.name,
                            GUID = guid.raw();

                        filesToUpload[GUID] = {
                            file: file,
                            reader: FReader,
                            resolve: resolve,
                            reject: reject
                        };

                        FReader.onload = function (event2) {
                            socket.emit('media.upload', {
                                name: name,
                                guid: GUID,
                                data: event2.target.result
                            });
                        };
                        socket.emit('media.start-upload', {
                            name: name,
                            guid: GUID,
                            size: file.size,
                            ju: self._ju
                        });

                    })
                    .then(function (data) {
                        uploaded.push(data);
                    });
            };
        })(next));
        next = this.files.shift();
    }
    promise.catch(function (error) {
        console.error(error);
    });
    promise.then(() => {
        self.emit('done', uploaded);
    });
    return promise;
};

module.exports = Upload;
