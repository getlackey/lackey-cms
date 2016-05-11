/* jslint node:true */
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
var lackey = require('core/client/js'),
    api = require('core/client/js/api');

lackey.bind('lky:cms.page.new', 'submit', function (event, hook) {

    event.preventDefault();
    event.stopPropagation();

    api.create('/cms/content', lackey.form(hook)).then(function () {
        lackey.hide('#new');
        //top.document.location.reload(true);
    }, function () {
        lackey.hide('#new');
        //top.document.location.reload(true);
    });

    return false;
});
