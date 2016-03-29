/* eslint no-underscore-dangle:0, no-param-reassign:0 */
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
let
    SCli = require('../../utils/cli'),
    View = require('express/lib/view'),
    adaro = require('adaro'),
    dustHelpers = require('dustjs-helpers').helpers,
    SUtils = require('../../utils'),
    fs = require('fs'),
    DustIntl = require('dust-intl');


module.exports = (server, config) => {

    SCli.debug('lackey-cms/server/init/views', 'Setting up');

    let instance = require(SUtils.getLackeyPath() + 'lib/server').instance,
        helpers = dustHelpers,
        dust = adaro.dust({
            cache: false
        });

    helpers.typeof = module.exports.typeof;

    // adaro doc sucks https://github.com/krakenjs/adaro/issues/103
    dust.dust.helpers = helpers;

    if (instance) {
        instance._dustHelpers.forEach((helper) => {
            helper(dust.dust);
        });
    }

    DustIntl.registerWith(dust.dust);

    dust.dust.debugLevel = 'DEBUG';

    server.engine('dust', dust);

    server.set('view engine', 'dust');
    server.disable('view cache');
    server.set('views', SUtils.getProjectPath());

    /**
     * Resolves template paths. Adaro supports lookup method, if it expose 3 parameters
     */
    View.prototype.lookup = module.exports.resolver(config.get('site'), SUtils.getLackeyPath(), SUtils.getProjectPath());

};

module.exports.resolver = (site, lackeyPath, projectPath) => {
    return (path, options, callback) => {
        // we need to create new instance per request to not lose refrence to original site
        let lookup = module.exports.lookup(site, lackeyPath, projectPath);
        return lookup(path, options, callback);
    };
};

module.exports.typeof = (chunk, context, bodies, params) => {
    return chunk.write(typeof params.val);
};

module.exports.context = (options, lackeyPath, projectPath, referredPath) => {

    try {

        let root = projectPath,
            site,
            path,
            parts,
            mod;

        SCli.debug('lackey-cms/server/init/views', 'context', referredPath);

        if (!options || !options.view || !options.view.path) {
            if (options && options.template && options.template !== referredPath) {
                path = options.template;
            } else {
                /* istanbul ignore next */
                return null;
            }
        } else {
            path = options.view.path;
        }

        SCli.debug('lackey-cms/server/init/views', 'context, path', path);

        if (path.startsWith(lackeyPath)) {
            SCli.debug('lackey-cms/server/init/views', 'Variant A');
            root = lackeyPath;
            site = null;
            mod = path.substr(lackeyPath.length).substr('modules/'.length).split('/')[0];
            return [root, site, mod];
        } else if (path.startsWith('~')) {
            SCli.debug('lackey-cms/server/init/views', 'Variant Home');
            root = projectPath + 'sites/default/';
            parts = path.split('/');
            site = 'default';
            mod = parts[1];
            return [root, site, mod];
        } else {
            SCli.debug('lackey-cms/server/init/views', 'Variant B');
            parts = path.substr((projectPath + 'sites/').length).split('/');
            root = projectPath + 'sites/' + parts[0] + '/';
            site = parts[0];
            mod = parts[2];
            return [root, site, mod];
        }

    } catch (e) {
        console.error(e);
    }
};

module.exports.lookup = (site, lackeyPath, projectPath) => {

    let fn = (path, options, callback) => {

        SCli.debug('lackey-cms/server/init/views', 'lookup', path, typeof path);

        let pathParts;

        if(Array.isArray(path)) {
            pathParts = path;
        } else if (path.indexOf(',') !== -1) {
            pathParts = path.split(',');
        }

        if (pathParts) {
            let part = pathParts.shift(),
                content, go = true;

            while (part && go) {
                content = fn(part + '.dust', options);
                SCli.debug('lackey-cms/server/init/views', 'check for page', content);
                if (fs.existsSync(content)) {
                    go = false;
                    path = part;
                }
                part = pathParts.shift();
            }
        }

        SCli.debug('lackey-cms/server/init/views', 'lookup', path);

        let parts = path.split('/'),
            root = projectPath + 'sites/' + site + '/',
            result = path,
            moduleName,
            results;

        switch (parts[0]) {
        case '~':
            SCli.debug('lackey-cms/server/init/views', 'home dir path');
            results = module.exports.context(options, lackeyPath, projectPath, path);
            if (results) {
                root = results[0];
                site = result[1];
                moduleName = results[2];
            }

            parts.shift();
            moduleName = parts.shift();
            result = root + 'modules/' + moduleName + '/server/views/' + parts.join('/');
            break;
        case '':
            SCli.debug('lackey-cms/server/init/views', 'not supported path');
            /* istanbul ignore next */
            throw new Error('Not supported path ' + path);
        case '.':
            SCli.debug('lackey-cms/server/init/views', 'relative path');
            results = module.exports.context(options, lackeyPath, projectPath, path);
            if (results) {
                root = results[0];
                site = result[1];
                moduleName = results[2];
            }

            parts.shift();
            result = root + 'modules/' + moduleName + '/server/views/' + parts.join('/');
            break;
        default:
            site = parts.shift();
            if (site === 'cms') {
                moduleName = parts.shift();
                result = lackeyPath + 'modules/' + moduleName + '/server/views/' + parts.join('/');
            } else if (site === 'sites') {
                site = parts.shift();
                moduleName = parts.shift();
                result = projectPath + 'sites/' + site + '/modules/' + moduleName + '/server/views/' + parts.join('/');

            } else {

                /* istanbul ignore next */
                //throw new Error('Not supported path ' + path);
            }
            break;
        }

        SCli.debug('lackey-cms/server/init/views', 'result', result);

        if (!fs.existsSync(result)) {
            let shared = result.replace(/\/modules\/([^\/]+)\/server\/views/, '/modules/$1/shared/views');
            if (fs.existsSync(shared)) {
                result = shared;
            }
        }

        if (!result.match(/\.dust$/)) {
            result = result + '.dust';
        }

        SCli.debug('lackey-cms/server/init/views', 'result', result);

        SCli.debug('lackey-cms/server/init/views', 'result', result);

        if (callback) {
            /* istanbul ignore next */
            callback(null, result);
        }

        return result;
    };

    return fn;

};
