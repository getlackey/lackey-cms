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

const compress = require('compression'),
    //favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    flash = require('connect-flash'),
    SCli = require('../../utils/cli');

module.exports = (app) => {

    SCli.debug('lackey-cms/server/basics', 'Setting up');

    // Showing stack errors
    app.set('showStackError', true);

    // Enable jsonp
    app.enable('jsonp callback');

    // Should be placed before express.static
    app.decorateMiddleware([compress({
        filter: /* istanbul ignore next */ function (req, res) {
            return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
        },
        level: 9
    })], 'compress');

    // Initialize favicon middleware
    //app.use(favicon('./modules/core/client/img/brand/favicon.ico'));

    // Request body parsing middleware should be above methodOverride
    app.decorateMiddleware([bodyParser.urlencoded({
        extended: true,
        limit: '10mb' //TODO: to config
    })], 'bodyParser.urlencoded');
    app.decorateMiddleware([bodyParser.json({
        limit: '10mb' //TODO: to config
    })], 'bodyParser.json');
    app.decorateMiddleware([bodyParser.raw({
        limit: '10mb' //TODO: to config
    })], 'bodyParser.raw');
    // reads the method from the querystring: ?_method=DELETE
    app.decorateMiddleware([methodOverride('_method')], 'methodOverride');

    // Add the cookie parser and flash middleware
    app.decorateMiddleware([cookieParser()], 'cookieParser');
    app.decorateMiddleware([flash()], 'flash');


    app.use((req, res, next) => {
        let oldRedirect = res.redirect;
        res.redirect = function () {
            let args = [].slice.call(arguments);
            SCli.debug('lackey-cms/server/basics', 'Redirect to ' + args.join(', '));
            return oldRedirect.apply(res, args);
        };
        next();
    });


};
