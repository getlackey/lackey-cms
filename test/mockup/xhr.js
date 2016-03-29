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


module.exports = function () {
    this._headers = {};
    this._data = {};
    this._method = null;
    this._uri = null;
    this.open = function (method, uri) {
        this._method = method;
        this._uri = uri;
    };
    let self = this;
    this.send = function (data) {
        self._data = data;
        this.readyState = 4;
        this.status = 200;
        self.respond.apply(this, [() => {
            self.onreadystatechange.apply(self,[]);
        }]);
    };
    this.onreadystatechange = () => {};
    this.setRequestHeader = function () {

    };
    this.respond = module.exports.respond;

    this.responseText = null;
};
module.exports.respond = function (callback) {
    callback();
}
