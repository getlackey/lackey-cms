/* eslint no-cond-assign:0, no-new:0 */
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
const lackey = require('core/client/js');

module.exports = function () {
    lackey
        .hook('header.user')
        .addEventListener('click', function () {
            var nav = this.querySelector('nav');

            var unbind, hide, mouseEnter, mouseLeave, timeout;

            nav.setAttribute('data-visible', '');

            unbind = function () {
                nav.removeEventListener('mouseleave', mouseLeave);
                nav.removeEventListener('mouseenter', mouseEnter);
            };

            hide = function () {
                unbind();
                nav.removeAttribute('data-visible');
            };

            mouseLeave = function () {
                clearTimeout(timeout);
                timeout = setTimeout(hide, 500);
            };

            mouseEnter = function () {
                clearTimeout(timeout);
            };

            clearTimeout(timeout);
            timeout = setTimeout(hide, 2000);

            nav.addEventListener('mouseleave', mouseLeave);
            nav.addEventListener('mouseenter', mouseEnter);
        });
};
