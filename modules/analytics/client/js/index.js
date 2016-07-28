/* jslint esnext:true, node:true, browser:true */
'use strict';
/**
    The MIT License (MIT)

    Copyright (c) 2016 Łukasz Marek Sielski

    This file is copied from http://github.com/sielay/skaryna

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/
var
    xhr = require('core/client/js/xhr'),
    reload = () => {

        Array.prototype.slice
            .apply(document.body.querySelectorAll('[data-lky-analytics]'))
            .forEach(element => {
                let config = element.getAttribute('data-lky-analytics');
                if (config) {
                    config
                        .split(';')
                        .forEach(entry => {
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
