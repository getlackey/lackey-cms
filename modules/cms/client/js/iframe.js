/* eslint no-cond-assign:0 */
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
const resolve = require('cms/client/js/iframe.resolve.js');

let base = document.querySelector('head base'),
    loc = document.location,
    basePath = base ? base.getAttribute('href') : (loc.protocol + '//' + loc.host + (loc.port && loc.port.length ? (':' + loc.port) : '') + '/'),
    adminPath = resolve(basePath, document.location.pathname),
    previewPath = resolve(basePath, '/cms/preview', false, '');

if (loc.href.replace(/\/$/, '') !== previewPath.replace(/\/$/, '')) {

    if (document.location.search && document.location.search.replace(/^\s+|\s+$/g, '').length) {
        adminPath += document.location.search;
    }

    if (top === window || top.document.location.href.replace(/\/$/, '') !== adminPath.replace(/\/$/, '')) {
        top.document.location.href = adminPath;
    }
}

function handleLinkClick(ev) {
    var location = document.location,
        anchor = ev.target;

    if (ev.defaultPrevented) {
        return;
    }

    if (anchor.host === location.host &&
        !anchor.pathname.match(/\.\w+/) &&
        !anchor.pathname.match(/\/admin/)) {

        ev.preventDefault();
        ev.stopPropagation();

        console.info('Overriding anchor navigation to admin page:', anchor.href);

        top.document.location.href = location.origin + '/admin' + anchor.pathname + anchor.hash;

        return false;
    }
}

window.addEventListener('load', () => {
    let links = document.querySelectorAll('a[href]');

    for (let i = 0; i < links.length; i += 1) {
        let link = links[i];

        link.addEventListener('click', handleLinkClick);
    }
});
