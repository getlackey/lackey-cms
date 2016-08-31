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
    api = require('core/client/js/api'),
    slugLib = require('slug'),
    growl = require('cms/client/js/growl'),
    name = lackey.select('input[name="title"]')[0],
    slug = lackey.select('input[name="slug"]')[0];

lackey
    .select('tbody tr')
    .forEach((row) => {
        lackey
            .select('input[type="radio"]', row)
            .forEach((input) => {
                row.style.cursor = 'pointer';
                row.addEventListener('click', () => {
                    input.checked = true;
                });
            });
    });

function error(message) {
    growl({
        status: 'error',
        message: message
    });
}

name.addEventListener('keyup', () => {
    slug.value = slugLib(name.value, {lower: true});
});

lackey.bind('form', 'submit', (event) => {
    event.preventDefault();
    event.stopPropagation();

    let pageName = name.value.replace(/^\s+|\s+$/g, ''),
        pageSlug = slug.value.replace(/^\s+|\s+$/g, ''),
        pageTemplate = null,
        templatePrefix = '',
        route;

    if (pageName.length === 0) {
        return error('Please type page title');
    }

    lackey
        .select('form tbody tr')
        .forEach((tableRow) => {
            lackey
                .select('input[type="radio"]', tableRow)
                .forEach((input) => {
                    if (input.checked) {
                        pageTemplate = input.value;
                        lackey
                            .select('pre', tableRow)
                            .forEach((pre) => {
                                templatePrefix = pre.innerText;
                            });
                    }
                });
        });

    if (!pageTemplate) {
        return error('Please chooose page template');
    }

    route = templatePrefix + pageSlug;

    api
        .read('/cms/content?route=' + encodeURI(route))
        .then((list) => {
            if (list && list.data && list.data.length) {
                return error('This route is already taken');
            }
            return api.create('/cms/content', {
                name: pageName,
                layout: {
                    type: 'Fields',
                    title: pageName
                },
                templateId: pageTemplate,
                route: route,
                type: 'page'
            });
        })
        .then((response) => {
            let base = document.querySelector('head base'),
                basePath = base.getAttribute('href');
            top.document.location.href = basePath + response.route.replace(/^\//, '');
        });
});
