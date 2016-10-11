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
var
    lackey = require('core/client/js'),
    api = require('core/client/js/es5/api'),
    growl = require('core/client/js/es5/growl');

lackey.bind('lky:cms.account.forgot', 'submit', function (event, hook) {

    event.preventDefault();
    event.stopPropagation();

    var data = lackey.form(hook);

    api.create('/account/forgot-password', data).then(function () {
        growl({
            status: 'success',
            message: 'Link has been sent to ' + data.username
        });
    }, function (error) {
        growl({
            status: 'error',
            message: error.toString()
        });
    });

    return false;
});
