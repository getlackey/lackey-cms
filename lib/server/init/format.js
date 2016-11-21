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
    _ = require('lodash'),
    nodeExcel = require('excel-export'),
    objectPath = require('object-path'),
    resolve = require('./../../../modules/cms/server/lib/dust/base'),
    views = require('./views');

var host;

module.exports = (server, config) => {
    SCli.debug('lackey-cms/server/init/format', 'Setting up');
    host = config.get('host');
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
        isXLS = !isJSON && !isYAML && (/(.*).xlsx/).test(req.path),
        isHTML = !isJSON && !isYAML && !isXLS;

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
    } else if (isXLS) {
        req.headers.accept = 'application/vnd.openxmlformats,*/*;q=0.1';
        req.headers['content-type'] = 'application/vnd.openxmlformats';
    }

    // to not check it twice
    let format = isJSON ? 'json' : (isYAML ? 'yaml' : (isXLS ? 'xlsx' : 'html')),
        lSend = res.send,
        lRedirect = res.redirect;

    req.__resFormat = format;
    res.__fragment = (/(.*)\.fragment(|\.json)$/).test(req.path);

    /**
     * [[Description]]
     * @param {Request|Error} _req
     * @param {Error} data
     */
    res.error = function (_req, data) {

        let err = data;
        if (!err) {
            err = arguments.length > 1 ? new Error('Empty error') : _req;
        }
        SCli.error(err);
        res.status(403).send({
            template: 'cms/core/error',
            data: err
        });
    };

    res.error404 = (_req, data) => {
        res.status(404).send({
            template: 'cms/core/error',
            data: data
        });
    };

    res.error403 = (_req, data) => {
        if (isHTML) {
            res.redirect('login?return=' + encodeURIComponent(res.req.originalUrl.replace(/^\//, '')));
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
            if (req.query && req.query.jsonpath) {
                output = objectPath.get(output, req.query.jsonpath);
            }
            res.send(JSON.stringify(output));
            break;
        case 'html':
            try {
                res.render(views.lookupPath(data._meta.template.path, '.dust'), output);
            } catch (err) {
                /* istanbul ignore next */
                res.send(err);
            }
            break;
            /* istanbul ignore next */
        case 'xlsx':
            try {
                let response = nodeExcel.execute(data.table || null);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader('Content-Disposition', 'attachment; filename=' + 'export.xlsx');
                res.end(response, 'binary');
            } catch (err) {
                /* istanbul ignore next */
                res.header('Content-Type', 'application/json');
                /* istanbul ignore next */
                console.log(err);
                res.send(JSON.stringify(err));
            }
            break;
        default:
            res.error('!' + format);
            break;
        }
    };

    res.redirect = (path) => {
        res.redirect = lRedirect;
        res.redirect(resolve.base(host, path));
    };

    res.edit = (value) => {
        res.__doc._edit = value;
    };

    res.variant = (value) => {
        res.__doc.variant = value;
    };

    res.__doc = {
        _meta: {
            route: decodeURIComponent(req.path),
            stylesheets: [],
            javascripts: [],
            defaultLocale: req.defaultLocale,
            locale: (() => {
                if (req.query && req.query.locale) {
                    req.session.locale = req.query.locale;
                    return req.query.locale;
                } else if (req.session && req.session.locale) {
                    return req.session.locale;
                }
                return req.locale;
            })(),
            host: host,
            env: process.env.NODE_ENV || 'development',
            post: req.body || {},
            query: req.query ? ((q) => {
                let query = {};
                Object.keys(q).forEach((key) => {
                    if (q[key] === 0 || (q[key] && q[key].length)) {
                        query[key] = q[key];
                    }
                });
                return query;
            })(req.query) : {}
        },
        _user: req.user,
        _admin: req.admin,
        _edit: false,
        _fragment: res.__fragment,
        _session: {
            ip: req.session ? req.session.ipAddress : 'n/a'
        }
    };

    res.css = (listOrOne) => {
        if (typeof listOrOne === 'string') {
            res.__doc._meta.stylesheets.push(listOrOne);
        } else {
            res.__doc._meta.stylesheets = res.__doc._meta.stylesheets.concat(listOrOne);
        }

    };

    res.js = (listOrOne) => {
        if (typeof listOrOne === 'string') {
            res.__doc._meta.javascripts.push(listOrOne);
        } else {
            res.__doc._meta.javascripts = res.__doc._meta.javascripts.concat(listOrOne);
        }
    };

    res.print = (template, data) => {

        let props = (data && data._props) ? data._props : {};
        res.send(_.merge({
            _meta: {
                template: template
            }
        }, data, {_props:props}, res.__doc));
    };

    next();
};

module.exports.rewrite = modRewrite([
    '(.*).json(\\?.*)?$ $1',
    '^(.*).xlsx(\\?.*)?$ $1',
    '^(.*).html?(\\?.*)?$ $1',
    '^(.*).yaml?(\\?.*)?$ $1'
]);
