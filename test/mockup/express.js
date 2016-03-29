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

class Express {

    constructor() {
        this._stack = [];
        this._middleware = [];
        this._flags = {};
        this._values = {};
    }

    use() {

    }

    decorateMiddleware(args, name) {
        this._middleware.push(name);
    }

    enable(name) {
        this._flags[name] = 1;
    }

    disable(name) {
        this._flags[name] = -1;
    }

    set(name, value) {
        this._values[name] = value;
    }


};

module.exports = Express;
