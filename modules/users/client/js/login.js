/* jslint browser:true, node:true */
'use strict';

var
    form = document.querySelector('form'),
    growl = require('cms/client/js/growl'),
    xhr = require('core/client/js/xhr'),
    qs = require('query-string');

form.addEventListener('submit', function (event) {

    event.stopPropagation();
    event.preventDefault();

    var data = {};

    Array.prototype.slice
        .apply(form.elements)
        .forEach(function (input) {
            if (!input.name || input.name === '') {
                return;
            }
            if (input.type === 'checkbox') {
                data[input.name] = input.checked ? input.value : null;
            } else {
                data[input.name] = input.value.trim();
            }
        });

    xhr
        .post('login', data)
        .then(function () {
            var query = qs.parse(document.location.search.replace(/^\?/, ''));
            if (query.return) {
                window.location.href = decodeURIComponent(query.return);
                return;
            }
            window.location.href = '/';
        }, function () {
            growl({
                message: 'Invalid credentials',
                status: 'error'
            });
        });

}, null);
