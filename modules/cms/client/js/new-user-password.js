/* jslint node:true, esnext:true, browser:true */
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
    growl = require('cms/client/js/growl');

function error(message) {
    growl({
        status: 'error',
        message: message
    });
}

function validPass(pass) { // TODO: move to backend
    if (!pass || pass.length < 6) return false;
    if (!pass.match(/\d+/g)) return false;
    if (!pass.match(/[a-zA-Z]+/g)) return false;
    if (!pass.match(/[^a-zA-Z0-9\d\s]/g)) return false;
    return true;
}

lackey.bind('form', 'submit', event => {

    var password = document.querySelector('[name=password]').value,
        password2 = document.querySelector('[name=password2]').value;

    if (password !== password2 && password2 !== undefined) {
        event.preventDefault();
        event.stopPropagation();
        error('Passwords don\'t match');
        return false;
    }
    if (!validPass(password)) {
        event.preventDefault();
        event.stopPropagation();
        error('Password has to be minimum 6 characters long, contain at least one letter, one digit and one special character');
        return false;
    }
});
