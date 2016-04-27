/*jslint node:true, unparam:true, regexp:true, esnext:true  */
'use strict';
/*
    Copyright 2015 Enigma Marketing Services Limited

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


const modRewrite = require('connect-modrewrite'),
    SCli = require('../../utils/cli'),
    json2yaml = require('json2yaml'),
    _ = require('lodash');

module.exports = (server) => {

    SCli.debug('lackey-cms/server/init/format', 'Setting up');
    server.decorateMiddleware([module.exports.cors], 'cors');
    server.decorateMiddleware([module.exports.format], 'format');
    server.decorateMiddleware([module.exports.rewrite], 'rewrite');

};

module.exports.cors = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

module.exports.format = (req, res, next) => {
    var isYAML = (/(.*).yaml/).test(req.path),
        isJSON = !isYAML && ((/(.*).json$/).test(req.path) || (/^\/api\//).test(req.path)),
        isHTML = !isJSON && !isYAML;

    // force accept and content type so it always handles with the mime type
    if (isHTML) {
        req.headers.accept = 'text/html,*/*;q=0.1';
        req.headers['content-type'] = 'text/html';
        res.header('Content-Type', 'text/html');
    } else if (isJSON) {
        req.headers.accept = 'application/json,*/*;q=0.1';
        req.headers['content-type'] = 'application/json';
        res.header('Content-Type', 'application/json');
    } else if (isYAML) {
        req.headers.accept = 'text/x-yaml,*/*;q=0.1';
        req.headers['content-type'] = 'text/x-yaml';
        res.header('Content-Type', 'text/x-yaml');
    }

    // to not check it twice
    let format = isJSON ? 'json' : (isYAML ? 'yaml' : 'html'),
        lSend = res.send;

    req.__resFormat = format;
    res.__fragment = (/(.*)\.fragment(|\.json)$/).test(req.path);

    res.error = (_req, data) => {
        let err = data || new Error('Empty error');
        SCli.error(err);
        res.status(403).send({
            template: 'cms/core/error',
            data: err
        });
    };

    res.error404 = (_req, data) => {
        res.status(403).send({
            template: 'cms/core/error',
            data: data
        });
    };

    res.error403 = (_req, data) => {
        if (isHTML) {
            res.redirect('/login');
            return;
        }
        res.status(403).send({
            template: 'cms/core/error',
            data: data
        });
    };

    res.send = (data, forceFormat) => {

        res.send = lSend;
        let output = {};
        output = _.merge(data);
        if (!forceFormat) {
            output.data = output.data || {};
            output.user = req.user;
            output.admin = req.admin;
            output.route = decodeURIComponent(req.path);
            if (res.viewAs && res.viewAs.length) {
                output.viewAs = res.viewAs;
                output.viewingAs = res.viewingAs;
            }
        } else {
            format = forceFormat;
        }

        switch (format) {
        case 'yaml':
            try {
                res.send(json2yaml.stringify(output));
            } catch (e) {
                format = 'json';
                res.send(JSON.stringify(e.message));
            }
            break;
        case 'json':
            res.send(JSON.stringify(output));
            break;
        case 'html':
            try {
                res.render(data.template, output);
            } catch (error) {
                /* istanbul ignore next */
                res.send(error);
            }
            break;
            /* istanbul ignore next */
        default:
            res.error('!');
            break;
        }
    };

    res.edit = (value) => {
        res.__doc.edit = value;
    };

    res.__doc = {
        stylesheets: [],
        javascripts: [],
        data: {},
        user: req.user,
        admin: req.admin,
        edit: false,
        fragment: res.__fragment,
        locale: req.locale,
        defaultLocale: req.defaultLocale,
        route: decodeURIComponent(req.path)
    };

    res.css = (listOrOne) => {
        if (typeof listOrOne === 'string') {
            res.__doc.stylesheets.push(listOrOne);
        } else {
            res.__doc.stylesheets = res.__doc.stylesheets.concat(listOrOne);
        }

    };

    res.js = (listOrOne) => {
        if (typeof listOrOne === 'string') {
            res.__doc.javascripts.push(listOrOne);
        } else {
            res.__doc.javascripts = res.__doc.javascripts.concat(listOrOne);
        }
    };

    res.print = (template, data) => {

        let props = (data && data.content && data.content.props) ? data.content.props : {};

        res.send(_.merge({
            data: data,
            template: template
        }, props, res.__doc));
    };

    next();
};

module.exports.rewrite = modRewrite([
    '(.*).json(\\?.*)?$ $1',
    '^(.*).xlsx(\\?.*)?$ $1',
    '^(.*).html?(\\?.*)?$ $1',
    '^(.*).yaml?(\\?.*)?$ $1'
]);
