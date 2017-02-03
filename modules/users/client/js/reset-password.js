/* eslint no-cond-assign:0, no-alert:0 */
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
    lackey = require('core/client/js'),
    xhr = require('core/client/js/xhr'),
    growl = require('cms/client/js/growl');


function validPass(pass) { // TODO: move to backend
    if (!pass || pass.length < 6) return false;
    if (!pass.match(/\d+/g)) return false;
    if (!pass.match(/[a-zA-Z]+/g)) return false;
    if (!pass.match(/[^a-zA-Z0-9\d\s]/g)) return false;
    return true;
}

lackey.bind('lky:password', 'submit', (event, hook) => {
    event.preventDefault();
    event.cancelBubble = true;
    let data = lackey.form(hook),
        type = data.type || 'reset';
    if (data.password !== data.password2 && data.password2 !== undefined) {
        growl({
            status: 'error',
            message: 'Passwords don\'t match'
        });
        return false;
    }
    if (!validPass(data.password)) {
        growl({
            status: 'error',
            message: 'Password has to be minimum 6 characters long, contain at least one letter, one digit and one special character'
        });
        return false;
    }
    xhr.post(window.location.href, {
        password: data.password
    }).then(() => {
        growl({
            status: 'success',
            message: 'Password ' + type + ' successfully'
        });
        setTimeout(function () {
            window.location.href = 'cms/account';
        }, 1500);
    });
    return false;
});
