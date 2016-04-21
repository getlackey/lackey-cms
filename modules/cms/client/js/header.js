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
const
    Manager = require('./manager'),
    querystring = require('query-string'),
    lackey = require('./../../../core/client/js');

Manager.init({
    controls: {
        structure: 'lky:cms.area.structure',
        save: 'lky:cms.actions.save',
        visibility: 'lky:cms.actions.visibility',
        settings: 'lky:cms.actions.settings',
        debug: 'lky:cms.actions.debug',
        taxonomy: 'lky:cms.actions.taxonomy',
        iframe: 'lky:iframe',
        properties: 'lky:cms.actions.properties',
        preview: 'lky:cms.actions.preview',
        create: 'lky:cms.actions.create',
        createdAt: 'lky:cms.page.created-at',
        createdAtTime: 'lky:cms.page.created-at-time'
    }
});

lackey.bind('lky:actAs', 'click', (event, hook) => {
    event.preventDefault();
    event.cancelBubble = true;
    lackey.setCookie('lky-view-as', hook.getAttribute('data-lky-act-as'));
    window.location.reload();
    return false;
});

lackey.bind('lky:viewAs', 'click', (event, hook) => {
    var qs = querystring.parse(document.location.search);
    event.preventDefault();
    event.cancelBubble = true;
    qs.variant = hook.getAttribute('data-lky-view-as');
    document.location.search = '?' + querystring.stringify(qs);
    return false;
});

lackey.bind('lky:viewIn', 'click', (event, hook) => {
    event.preventDefault();
    event.cancelBubble = true;
    lackey.setCookie('lky-view-in', hook.getAttribute('data-lky-language'));
    window.location.reload();
    return false;
});
