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
    xhr = require('core/client/js/xhr'),
    growl = require('cms/client/js/growl');

module.exports = function (el, cb) {
    var root = el || document,
        callback = cb || function () {};

    function error(message) {
        growl({
            status: 'error',
            message: message
        });
    }

    function success(message) {
        growl({
            status: 'success',
            message: message
        });
    }

    lackey.bind('form', 'submit', event => {
        event.preventDefault();
        event.stopPropagation();

        var name = document.querySelector('[name=name]').value,
            email = document.querySelector('[name=email]').value,
            role = document.querySelector('[name=role]').value;

        if (!name) {
            return error('Please enter a name');
        }
        if (!email) {
            return error('Please enter an email');
        }
        if (!role) {
            return error('Please chooose a role');
        }

        return xhr.basedPost('/cms/user/create', {
            name: name,
            email: email,
            role: role
        })
        .then(response => {
            var data = JSON.parse(response);
            if (data.status === 'success') {
                success(data.msg);
                callback();
                document.querySelector('[name=name]').value = '';
                document.querySelector('[name=email]').value = '';
            } else {
                error(data.msg);
            }
        })
        .catch(issue => error(issue));
    }, root);
};
