/* jslint node:true, esnext:true */
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
    xhr = require('./xhr'),
    lackey = require('./index'),
    engine = require('dustjs-linkedin'),
    helpers = require('dustjs-helpers'),
    iterate = require('../../shared/dust/iterate'),
    hashmap = require('../../shared/dust/hashmap'),
    list = require('../../shared/dust/list'),
    path = require('../../shared/dust/path');

engine.helpers = helpers.helpers;
iterate(engine);
hashmap(engine);
list(engine);
path(engine);

function load(name) {
    return xhr.get('dust/' + name + '.js').then((template) => {
        // need to do that so we don't have to expose dust compile
        /*jslint evil: true */
        let loadTemplate = new Function('dust', template); //eslint-disable-line no-new-func
        /*jslint evil: false */
        loadTemplate(engine);
        return template;
    });
}

engine.onLoad = function () {
    let templateName = arguments[0],
        callback;
    if (arguments.length > 2) {
        /* istanbul ignore next */
        callback = arguments[2];
    } else {
        callback = arguments[1];
    }
    return load(templateName).then((template) => {
        if (!template) {
            return callback(new Error('Template ' + templateName + ' not found'));
        }
        callback(null, template);
    }, (error) => {
        callback(error);
    });
};


function render(name, vars, options) {
    return new Promise((resolve, reject) => {

        engine.render(name, vars, function (err, html) {
            if (err) {
                return reject(err);
            }
            let container;
            if (html.match(/^<tr/)) {
                container = document.createElement('tbody');
            } else {
                container = document.createElement('div');
            }
            container.innerHTML = html;
            if (options && options.returnRoot) {
                resolve(container);
            } else {
                resolve(Array.prototype.slice.call(container.childNodes));
            }
        });

    });
}

function redraw(hook, vars, root) {
    return Promise.all(lackey.hooks(hook, root).map((node) => {
        let template = node.getAttribute('data-lky-template');
        return render(template, vars)
            .then((domNodes) => {
                node.innerHTML = '';
                domNodes.forEach((domNode) => node.appendChild(domNode));
            });
    }));
}

module.exports = {
    render: render,
    redraw: redraw
};
