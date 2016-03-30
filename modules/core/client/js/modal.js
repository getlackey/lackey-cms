/* jslint node:true, esnext:true */
/* global top */
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
const template = require('./template'),
    lackey = require('./index');

class Modal {
    static open(name, vars, controller) {
        return template.render(name, vars, {
                returnRoot: true
            })
            .then((root) => {

                top.document.body.appendChild(root);

                setTimeout(() => {
                    lackey.addClass(root, 'open');
                }, 100);

                return new Promise((resolve, reject) => {
                    setTimeout(() => controller(root, vars, resolve, reject), 0);
                }).then((data) => {
                    top.document.body.removeChild(root);
                    return data;
                }, (error) => {
                    top.document.body.removeChild(root);
                    throw error;
                });
            });
    }

}

module.exports = Modal;
