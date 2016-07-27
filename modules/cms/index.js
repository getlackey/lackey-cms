/* jslint node:true, esnext:true */
/* globals LACKEY_PATH */
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
    SUtils = require(LACKEY_PATH).utils,
    editable = require('./server/lib/dust/editable'),
    translate = require('./server/lib/dust/translate'),
    acl = require('./server/lib/dust/acl'),
    image = require('./server/lib/dust/media'),
    error = require('./server/lib/dust/error'),
    embed = require('./server/lib/dust/embed'),
    attr = require('./server/lib/dust/attr'),
    block = require('./server/lib/dust/block'),
    list = require('./server/lib/dust/list'),
    acronym = require('./server/lib/dust/acronym'),
    is = require('./../core/shared/dust/is'),
    taxonomy = require('./server/lib/dust/taxonomy'),
    hasContent = require('./server/lib/dust/has-content'),
    tweet = require('./server/lib/dust/tweet'),
    config = require('./server/lib/dust/config'),
    userHas = require('./server/lib/dust/user-has'),
    base = require('./server/lib/dust/base'),
    filter = require('./server/lib/dust/filter'),
    socket = SUtils.cmsMod('core').path('server/models/media/sockets'),
    sitemap = require(LACKEY_PATH).sitemap;

/**
 * @param {lackey-cms/lib/server/Server} instance
 */
module.exports = (instance) => {

    instance.addDustHelper(error);
    instance.addDustHelper(editable);
    instance.addDustHelper(image);
    instance.addDustHelper(embed);
    instance.addDustHelper(attr);
    instance.addDustHelper(block);
    instance.addDustHelper(list);
    instance.addDustHelper(taxonomy);
    instance.addDustHelper(hasContent);
    instance.addDustHelper(tweet);
    instance.addDustHelper(is);
    instance.addDustHelper(translate);
    instance.addDustHelper(acronym);
    instance.addDustHelper(config);
    instance.addDustHelper(userHas);
    instance.addDustHelper(base);
    instance.addDustHelper(acl);
    instance.addDustHelper(filter);

    sitemap.addSource(() => {
        return require('./server/controllers/content')
            .then((ctrl) => ctrl.generateSitemap());
    });

    instance.addMiddleware((server) => {
        return require('./server/controllers/redirect')
            .then((RedirectController) => {
                server.use(RedirectController.capture);

            });
    });

    instance.addPostRouteWare((server) => {
        return require('./server/controllers/page')
            .then((PageController) => {
                server.use(PageController.capture);
            });
    });

    instance.addSocketware(socket);
};
