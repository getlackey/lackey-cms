/* jslint esnext:true, node:true */
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
    express = require('express'),
    SCli = require('../utils/cli'),
    SUtils = require('../utils'),
    basics = require('./init/basics'),
    locale = require('./init/locale'),
    logger = require('./init/logger'),
    statics = require('./init/static'),
    slashes = require('connect-slashes'),
    views = require('./init/views'),
    env = require('./init/envvars'),
    format = require('./init/format'),
    crud = require('./init/crud'),
    api = require('./init/api'),
    rest = require('./init/rest'),
    uncap = require('./init/uncap');

module.exports = (config, middlewares) => {

    SCli.debug('lackey-cms/server/express', 'Setting up express');

    // Initialize express app
    let app = express();

    app.decorateMiddleware = (middleware, label) => {
        SCli.debug('lackey-cms/server/express', 'Setting up express ', label);
        app.use.apply(app, middleware);
    };

    app.use((req, res, next) => {
        SCli.debug('lackey-cms/server/expres', 'REQUEST ===============================================');
        next();
    });

    basics(app, config);
    logger(app, config);

    statics(app, config);
    app.decorateMiddleware([slashes(false)], 'slashes');
    views(app, config);
    env(app, config);
    uncap(app, config);

    return SUtils
        .serialPromise(middlewares, (middleware) => {
            let promise = middleware(app);
            if (!promise || !promise.then) {
                promise = Promise.resolve(promise);
            }
            return promise;
        })
        .then(() => {

            locale(app, config);
            format(app, config);
            crud(app, config);
            api(app, config);
            rest(app, config);

            SCli.debug('lackey-cms/server/express', 'Ready');
            return app;
        });

};
