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

module.exports = () => {
    let obj = {
        send: (mail, callback) => {
            obj._messages.push(mail);
            callback(null, mail);
        },
        _messages: [],
        last: () => {
            return obj._messages[obj._messages.length - 1];
        },
        name: 'test',
        version: '0.1.0'
    };
    return obj;
};
