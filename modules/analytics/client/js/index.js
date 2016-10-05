/* jslint node:true, browser:true */
'use strict';

var
    xhr = require('core/client/js/es5/xhr'),
    reload = function () {

        Array.prototype.slice
            .apply(document.body.querySelectorAll('[data-lky-analytics]'))
            .forEach(function (element) {
                var
                config = element.getAttribute('data-lky-analytics');
                if (config) {
                    config
                        .split(';')
                        .forEach(function (entry) {
                            var pair = entry.split('|');
                            element.addEventListener(pair[0], function () {
                                var base = document.head.querySelector('base').getAttribute('href').toString().replace(/(\/|)$/, '/');
                                xhr.get(base + 'stat/' + encodeURIComponent((pair[1] || element.href)));
                            }, true);
                        });
                }
                element.removeAttribute('data-lky-analytics');
            });

        setTimeout(1000 * 60, reload);

    };

reload();
