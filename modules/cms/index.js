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

if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../lib';
}

const editable = require('./server/lib/dust/editable'),
    image = require('./server/lib/dust/media'),
    error = require('./server/lib/dust/error'),
    embed = require('./server/lib/dust/embed'),
    attr = require('./server/lib/dust/attr'),
    block = require('./server/lib/dust/block'),
    list = require('./server/lib/dust/list'),
    taxonomy = require('./server/lib/dust/taxonomy'),
    hasContent = require('./server/lib/dust/has-content'),
    tweet = require('./server/lib/dust/tweet'),
    sitemap = require(LACKEY_PATH).sitemap;

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
    sitemap.addSource(() => {
        return require('./server/controllers/content')
            .then((ctrl) => ctrl.generateSitemap());
    });
    instance.addPostRouteWare((server) => {
        return require('./server/controllers/page')
            .then((PageController) => {
                server.use(PageController.capture);
            });
    });
};
