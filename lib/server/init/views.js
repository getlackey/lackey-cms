/* eslint no-underscore-dangle:0, no-param-reassign:0 */
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
let
    SCli = require('../../utils/cli'),
    View = require('express/lib/view'),
    adaro = require('adaro'),
    dustHelpers = require('dustjs-helpers').helpers,
    commonDustJSHelpers = require('common-dustjs-helpers'),
    SUtils = require('../../utils'),
    DustIntl = require('dust-intl'),
    path = require('path'),
    namingConvention = require('dust-naming-convention-filters');


module.exports = (server) => {

    SCli.debug('lackey-cms/server/init/views', 'Setting up');

    let instance = require(LACKEY_PATH).server.instance,
        helpers = dustHelpers,
        dust = adaro.dust({
            cache: false
        });

    helpers.typeof = module.exports.typeof;

    // adaro doc sucks https://github.com/krakenjs/adaro/issues/103
    dust.dust.helpers = helpers;

    commonDustJSHelpers.exportTo(dust);

    if (instance) {
        instance._dustHelpers.forEach((helper) => {
            helper(dust.dust);
        });
    }

    DustIntl.registerWith(dust.dust);
    namingConvention(dust.dust);

    server.engine('dust', dust);

    server.set('view engine', 'dust');
    server.disable('view cache');
    server.set('views', SUtils.getProjectPath());

    /**
     * Resolves template paths. Adaro supports lookup method, if it expose 3 parameters
     */
    View.prototype.lookup = module.exports.resolver(LACKEY_PATH, SUtils.getProjectPath());

};

module.exports.resolver = (lackeyPath, projectPath) => {
    return (_path, options, callback) => {
        // we need to create new instance per request to not lose refrence to original site
        let lookup = module.exports.lookup(lackeyPath, projectPath);
        return lookup(_path, options, callback);
    };
};

module.exports.typeof = (chunk, context, bodies, params) => {
    return chunk.write(typeof params.val);
};

module.exports.context = (options, lackeyPath, projectPath, referredPath) => {

    try {

        let root = projectPath,
            site,
            _path,
            parts,
            mod;

        SCli.debug('lackey-cms/server/init/views', 'context', referredPath);

        if (!options || !options.view || !options.view.path) {
            if (options && options.template && options.template.indexOf(referredPath) !== -1) {
                _path = referredPath;
            } else if (options && options.template && !Array.isArray(options.template) && options.template !== referredPath) {
                _path = options.template;
            } else {
                /* istanbul ignore next */
                return null;
            }
        } else {
            _path = options.view.path;
        }

        SCli.debug('lackey-cms/server/init/views', 'context, path', _path);

        if (_path.startsWith(lackeyPath)) {
            SCli.debug('lackey-cms/server/init/views', 'Variant A');
            root = lackeyPath;
            site = null;
            mod = _path.substr(lackeyPath.length).substr('modules/'.length).split('/')[0];
            return [root, site, mod];
        } else if (_path.startsWith('~')) {
            SCli.debug('lackey-cms/server/init/views', 'Variant Home');
            root = projectPath;
            parts = _path.split('/');
            site = 'default';
            mod = parts[1];
            return [root, site, mod];
        } else {
            SCli.debug('lackey-cms/server/init/views', 'Variant B');
            parts = _path.substr((projectPath + 'sites/').length).split('/');
            root = projectPath;
            site = parts[0];
            mod = parts[2];
            return [root, site, mod];
        }

    } catch (e) {
        console.error(e);
    }
};

module.exports.lookup = (lackeyPath, projectPath) => {

    let fn = (_path, options, callback) => {

        if (typeof _path === 'string' && _path.indexOf(',') >= 0) {
            /* express is stupid */
            _path = _path.replace(/\.dust$/, '').split(',');
        }

        SCli.debug('lackey-cms/server/init/views', 'lookup', _path, typeof _path);

        let pathParts;

        if (Array.isArray(_path)) {
            pathParts = _path;
        } else if (_path.indexOf(',') !== -1) {
            pathParts = _path.split(',');
        }

        if (pathParts) {
            _path = null;
            let part = pathParts.shift(),
                content, go = true;

            while (part && go) {
                content = fn(part + '.dust', options);
                SCli.debug('lackey-cms/server/init/views', 'check for page', content);
                if (SUtils.fileExistsSync(content)) {
                    go = false;
                    _path = part;
                }
                part = pathParts.shift();
            }
        }

        SCli.debug('lackey-cms/server/init/views', 'lookup', _path);

        let parts = _path.split('/'),
            root = projectPath,
            result = _path,
            moduleName,
            results;

        switch (parts[0]) {
        case '~':
            {
                SCli.debug('lackey-cms/server/init/views', 'home dir path');
                results = module.exports.context(options, lackeyPath, projectPath, _path);
                if (results) {
                    root = results[0];
                    moduleName = results[2];
                }

                parts.shift();
                moduleName = parts.shift();
                result = root + 'modules/' + moduleName + '/server/views/' + parts.join('/');
                break;
            }
        case '':
            {
                SCli.debug('lackey-cms/server/init/views', 'not supported path');
                /* istanbul ignore next */
                throw new Error('Not supported path ' + _path);
            }
        default:
            {
                let site = parts.shift();
                if (site === 'cms') {
                    moduleName = parts.shift();
                    result = path.resolve(path.join(lackeyPath, '/../modules/', moduleName, '/server/views/', parts.join('/')));
                } else if (site === 'sites') {
                    site = parts.shift();
                    moduleName = parts.shift();
                    result = projectPath + 'modules/' + moduleName + '/server/views/' + parts.join('/');

                } else {

                    /* istanbul ignore next */
                    //throw new Error('Not supported path ' + path);
                }
                break;
            }
        }

        SCli.debug('lackey-cms/server/init/views', 'result', result);

        if (!SUtils.fileExistsSync(result)) {
            let shared = result.replace(/\/modules\/([^\/]+)\/server\/views/, '/modules/$1/shared/views');
            if (SUtils.fileExistsSync(shared)) {
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
