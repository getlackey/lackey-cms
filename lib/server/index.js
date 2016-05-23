/* eslint no-underscore-dangle:0, no-process-exit:0 */
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
const SUtils = require('../utils'),
    SCli = require('../utils/cli'),
    configFactory = require('../configuration'),
    datasources = require('../datasources'),
    express = require('./express'),
    errors = require('./init/errors'),
    moduleLoader = require('./module-loader'),
    glob = require('glob'),
    BbPromise = require('bluebird'),
    fs = require('fs'),
    fse = require('fs-extra'),
    path = require('path'),
    sass = require('node-sass'),
    mkdirp = require('mkdirp'),
    uglifyify = require('uglifyify'),
    dustjs = require('dustjs-linkedin'),
    sitemap = require('../sitemap'),
    postcss = require('postcss'),
    autoprefixer = require('autoprefixer'),
    prefixer = postcss([autoprefixer({
        browsers: [
            'last 2 versions', 'IE 9', 'iOS >= 8'
        ]
    })]),
    browserify = require('browserify');

function hasDirFor(anyPath, pathIsFile) {
    let dirPath = !pathIsFile ? path.dirname(anyPath) : anyPath;
    SCli.debug('lackey-cms/server', 'Ensure that there is dir ' + dirPath + ' for ' + path.basename(anyPath));
    return new BbPromise((resolve, reject) => {
        mkdirp(dirPath, (error) => {
            if (error) {
                /* istanbul ignore next : don't bother */
                SCli.debug('lackey-cms/server', 'FAIL Ensure that there is dir ' + dirPath + ' for ' + path.basename(anyPath));
                return reject(error);
            }
            SCli.debug('lackey-cms/server', 'FINISHED Ensure that there is dir ' + dirPath + ' for ' + path.basename(anyPath));
            resolve();
        });
    });
}

class Server {

    constructor(config) {
        SCli.debug('lackey-cms/server', 'Server instance created');
        this._config = config;
        let htdocs = SUtils.getProjectPath() + 'sites/' + this._config.get('site') + '/htdocs';
        this._paths = {
            css: htdocs + '/css',
            lackeyCss: htdocs + '/css/cms',
            js: htdocs + '/js',
            lackeyJs: htdocs + '/js/cms'
        };
        this._modules = {};
        this._middlewares = [];
        this._postRouteWare = [];
        this._postwares = [];
        this._falcorRoutes = [];
        this._dustHelpers = [];
        this._started = false;

    }

    init() {
        SCli.log('lackey-cms/server', '1. Loading config');
        return BbPromise.resolve()
            .bind(this)
            .then(this._loadModules)
            .then(this._loadResources)
            .then(this._loadDataSources)
            .then(this._setupExpress)
            .then((server) => {
                this._express = server;
                return server;
            })
            .then(this._initModules)
            .then(this._listen)
            .then(this._capture);

    }

    recompile() {
        SCli.debug('lackey-cms/server', 'Recompile resources');
        return BbPromise.resolve().bind(this).then(this._loadResources);
    }

    addDustHelper(helper) {
        this._dustHelpers.push(helper);
    }

    addMiddleware(middleware) {
        if (this._started) {
            /* istanbul ignore next : it's too stupid to test */
            throw new Error('Express already started');
        }
        this._middlewares.push(middleware);
    }

    addPostRouteWare(postware) {
        if (this._started) {
            /* istanbul ignore next : it's too stupid to test */
            throw new Error('Express already started');
        }
        this._postRouteWare.push(postware);
    }

    addPostware(postware) {
        if (this._started) {
            /* istanbul ignore next : it's too stupid to test */
            throw new Error('Express already started');
        }
        this._postwares.push(postware);
    }

    getModule(name) {
        return this._modules[name];
    }

    setModule(name, value) {
        this._modules[name] = value;
        return this._modules[name];
    }

    getExpress() {
        return this._server;
    }


    getConfig() {
        return this._config;
    }

    _compileSassFile(filePath, isLackey) {

        if (path.basename(filePath)[0] === '_') {
            return false;
        }

        let outputPath = this._paths.css + '/' + (isLackey ? 'cms/' : '') + filePath.replace(/^.*\/([^\/]+)\/client\/scss\/([^\/]+)\.scss$/, '$1/$2.css');

        SCli.debug('lackey-cms/server', 'Compiling SCSS file ' + filePath + ' to ' + outputPath);

        return hasDirFor(outputPath).then(() => {

            return new BbPromise((resolve, reject) => {
                sass.render({
                    includePaths: [SUtils.getLackeyPath() + 'node_modules/foundation-sites/scss'],
                    file: filePath,
                    outFile: outputPath
                }, (error, result) => {

                    if (error) {
                        /* istanbul ignore next : it's too stupid to test */
                        console.error(outputPath);
                        console.error(error);
                        return reject(error);
                    }
                    prefixer.process(result.css)
                        .then((prefixed) => {
                            fs.writeFile(outputPath, prefixed.css, (error2) => {
                                if (error2) {
                                    /* istanbul ignore next : it's too stupid to test */
                                    return reject(error2);
                                }
                                resolve();
                            });
                        }, (err) => {
                            reject(err);
                        });
                });
            });
        });


    }

    _compileSass(sassPath, isLackey) {

        SCli.debug('lackey-cms/server', 'Compiling SCSS in ' + sassPath);

        let self = this;

        return new BbPromise((resolve, reject) => {
            glob(sassPath + 'modules/*/client/scss/**/*.scss', (err, files) => {
                if (err) {
                    /* istanbul ignore next : it's too stupid to test */
                    return reject(err);
                }
                let promises = [];
                files.forEach((file) => {
                    let promise = self._compileSassFile(file, isLackey);
                    if (promise) {
                        promises.push(promise);
                    }
                });
                BbPromise.all(promises).then(resolve, reject);
            });
        }).then(() => {
            SCli.debug('lackey-cms/server', 'FINISHED Compiling SCSS in ' + sassPath);
        });
    }


    _ensureDirs() {
        SCli.debug('lackey-cms/server', 'Ensures dirs exists');
        let promises = [],
            self = this;
        Object.keys(this._paths).forEach((key) => {
            promises.push(hasDirFor(self._paths[key], true));
        });
        return BbPromise.all(promises).then(() => {
            SCli.debug('lackey-cms/server', 'FINISHED Ensures dirs exists');
        });
    }

    _combineJS(filePath, isLackey) {

        let
            outputPath = filePath.replace(/^.*\/modules\/([^\/]+)\/client\/js\/([^\/]+)\.js/, this._paths.js + '/' + (isLackey ? 'cms/' : '') + '$1/$2.js'),
            stream;

        SCli.debug('lackey-cms/server', 'Compiling ' + filePath + ' to ' + outputPath);

        return hasDirFor(outputPath).then(() => {

            stream = fs.createWriteStream(outputPath);

            return new BbPromise((resolve, reject) => {
                try {

                    stream.on('finish', () => {
                        resolve();
                    });

                    browserify({})
                        .add(filePath)
                        .plugin(uglifyify)
                        .bundle()
                        .pipe(stream);

                } catch (error) {
                    /* istanbul ignore next : it's too stupid to test */
                    reject(error);
                }
            });
        });
    }

    _combineJSs(dirPath, isLackey) {

        SCli.debug('lackey-cms/server', 'Compiling JavaScript in ' + dirPath);

        let self = this;

        return new BbPromise((resolve, reject) => {
            glob(dirPath + 'modules/*/client/js/*.js', (err, files) => {
                if (err) {
                    /* istanbul ignore next : it's too stupid to test */
                    return reject(err);
                }
                SUtils.serialPromise(files, (file) => {
                    return self._combineJS(file, isLackey);
                }).then(() => {
                    SCli.debug('lackey-cms/server', 'FINISHED Compiling JavaScript in ' + dirPath);
                    resolve();
                }, reject);
            });
        });
    }

    _copyImageDir(dirPath, isLackey, dir) {
        let self = this;
        return new BbPromise((resolve, reject) => {
            let dist = (isLackey ? 'cms/' : '') + (path.relative(dir, dirPath).replace(/^modules\/(.+?)\/client\/img$/, '$1'));
            fse.copy(dirPath, SUtils.getProjectPath() + 'sites/' + self._config.get('site') + '/htdocs/img/' + dist, (error) => {
                if (error) {
                    /* istanbul ignore next : it's too stupid to test */
                    return reject(error);
                }
                resolve();
            });

        });
    }

    _copyImages(dirPath, isLackey) {
        SCli.debug('lackey-cms/server', 'Compiling images in ' + dirPath);
        let self = this;

        return new BbPromise((resolve, reject) => {
            glob(dirPath + 'modules/*/client/img', (err, files) => {
                return BbPromise.all(files.map((dir) => {
                    return self._copyImageDir(dir, isLackey, dirPath);
                })).then(resolve, reject);
            });
        }).then(() => {
            SCli.debug('lackey-cms/server', 'FINISHED Compiling images in ' + dirPath);
        });
    }

    _copyFonts(dirPath, isLackey) {
        SCli.debug('lackey-cms/server', 'Compiling fonts in ' + dirPath);
        let self = this;

        return new BbPromise((resolve, reject) => {
            glob(dirPath + 'modules/*/client/fonts', (err, files) => {
                return BbPromise.all(files.map((dir) => {
                    return self._copyFontsDir(dir, isLackey, dirPath);
                })).then(resolve, reject);
            });
        }).then(() => {
            SCli.debug('lackey-cms/server', 'FINISHED Compiling images in ' + dirPath);
        });
    }

    _copyFontsDir(dirPath, isLackey, dir) {
        let self = this;
        return new BbPromise((resolve, reject) => {
            let dist = (isLackey ? 'cms/' : '') + (path.relative(dir, dirPath).replace(/^modules\/(.+?)\/client\/fonts$/, '$1'));
            fse.copy(dirPath, SUtils.getProjectPath() + 'sites/' + self._config.get('site') + '/htdocs/fonts/' + dist, (error) => {
                if (error) {
                    /* istanbul ignore next : it's too stupid to test */
                    return reject(error);
                }
                resolve();
            });

        });
    }

    _renderTemplate(file, isLackey, dirPath) {
        let self = this;

        return new BbPromise((resolve, reject) => {
            fs.readFile(file, 'utf8', (error, content) => {
                try {
                    if (error) {
                        /* istanbul ignore next : don't bother */
                        return reject(error);
                    }
                    let name = (isLackey ? 'cms/' : '') + path.relative(dirPath, file).replace((/^modules\/(.+?)\/(client|shared)\/views\/(.+)\.dust$/), '$1/$3'),
                        template = dustjs.compile(content, name),
                        savePath = SUtils.getProjectPath() + 'sites/' + self._config.get('site') + '/htdocs/dust/' + name + '.js';

                    hasDirFor(savePath).then(() => {
                        fs.writeFile(savePath, template, 'utf8', (error2) => {
                            if (error2) {
                                /* istanbul ignore next : it's too stupid to test */
                                return reject(error2);
                            }
                            resolve();
                        });
                    }, (error2) => {
                        /* istanbul ignore next : it's too stupid to test */
                        reject(error2);
                    });
                } catch (e) {
                    /* istanbul ignore next : it's too stupid to test */
                    reject(e);
                }
            });
        });
    }

    _renderTemplates(dirPath, isLackey) {
        SCli.log('lackey-cms/server', 'Compiling templates in ' + dirPath);
        let self = this;

        return new BbPromise((resolve, reject) => {
            glob(dirPath + 'modules/*/+(client|shared)/**/*.dust', (err, files) => {
                return BbPromise.all(files.map((file) => {
                    return self._renderTemplate(file, isLackey, dirPath);
                })).then(() => {
                    SCli.debug('lackey-cms/server', 'FINISHED Compiling demplates in ' + dirPath);
                    resolve();
                }, reject);
            });
        });
    }

    _do(fn, ctx, args) {
        return function () {
            return fn.apply(ctx, args);
        };
    }

    _loadResources() {
        SCli.log('lackey-cms/server', '3. Loading resources');
        return this._ensureDirs()
            .then(this._do(this._compileSass, this, [SUtils.getLackeyPath(), true]))
            .then(this._do(this._compileSass, this, [SUtils.getProjectPath() + 'sites/' + this._config.get('site') + '/']))
            .then(this._do(this._combineJSs, this, [SUtils.getLackeyPath(), true]))
            .then(this._do(this._combineJSs, this, [SUtils.getProjectPath() + 'sites/' + this._config.get('site') + '/']))
            .then(this._do(this._copyImages, this, [SUtils.getLackeyPath(), true]))
            .then(this._do(this._copyImages, this, [SUtils.getProjectPath() + 'sites/' + this._config.get('site') + '/']))
            .then(this._do(this._renderTemplates, this, [SUtils.getLackeyPath(), true]))
            .then(this._do(this._renderTemplates, this, [SUtils.getProjectPath() + 'sites/' + this._config.get('site') + '/']))
            .then(this._do(this._copyFonts, this, [SUtils.getLackeyPath(), true]))
            .then(this._do(this._copyFonts, this, [SUtils.getProjectPath() + 'sites/' + this._config.get('site') + '/']));

    }

    _capture() {
        SCli.log('lackey-cms/server', '8. Capture');
        let _this = this;

        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(false); // disable this all CLI nonsense
        }
        /* istanbul ignore next : interactive */
        process.on('SIGINT', () => {
            SCli.log('lackey-cms/server', 'Gracefull exit');
            _this._server.close(() => {
                // todo close databases
                process.exit();
            });
        });
        /*
        moduleLoader.list().forEach((module) => {
            watch.createMonitor(moduleLoader.get(module).path, function (monitor) {
                monitor.files[moduleLoader.get(module).path + '/.zshrc']; //eslint-disable-line no-unused-expressions
                monitor.on('created', function () {
                    _this.recompile();
                });
                monitor.on('changed', function () {
                    _this.recompile();
                });
                monitor.on('removed', function () {
                    _this.recompile();
                });
            });

        });*/

        return this;

    }

    _listen() {
        SCli.log('lackey-cms/server', '7. Listen');
        this._falcorReady(this._falcorRoutes);

        let _this = this;

        this._postwares.forEach((postware) => {
            this._express.use(postware);
        });

        errors(this._express, this._config);

        return new BbPromise((resolve, reject) => {
            let port = this._config.get('http.port'),
                server;

            SCli.log('lackey-cms/server', 'Will listen to ' + port + ' node PORT env is equal ' + process.env.PORT);

            server = this._express.listen(port, (err) => {

                if (err) {
                    /* istanbul ignore next : it's too stupid to test */
                    return reject(err);
                }

                let host = server.address().address,
                    listeningPort = server.address().port;

                _this._server = server;

                sitemap.refresh();

                SCli.debug('lackey-cms/server', 'App listening to `' + host + '` at `' + listeningPort + '`');
                resolve(server);

            });
        });

    }

    _setupExpress() {
        SCli.log('lackey-cms/server', '5. Initing modules');
        return express(this._config, this._middlewares).then((result) => {
            this._express = result[0];
            this._falcorReady = result[1];
            return this._express;
        });
    }

    _initModules() {

        SCli.log('lackey-cms/server', '6. Initing modules');
        let _this = this,
            current = BbPromise.cast();

        moduleLoader.list().forEach((module) => {
            current = current.then(() => moduleLoader.loadModels(module));
        });
        moduleLoader.list().forEach((module) => {
            current = current.then(() => moduleLoader.loadRoutes(module, _this._express, _this._falcorRoutes));
        });
        if (_this._postRouteWare.length) {
            current = current.then(() => {
                return SUtils.serialPromise(_this._postRouteWare, (middleware) => {
                    return middleware(_this._express);
                });
            });
        }
        return current;
    }

    _loadModules() {
        SCli.log('lackey-cms/server', '2. Loading modules');
        return moduleLoader(this, this._config);
    }

    _loadDataSources() {
        SCli.log('lackey-cms/server', '4. Loading data sources');
        let promise = datasources.connect(this._config.get('datasources'));
        if (this._config.get('yml.drop') === true) {
            SCli.log('lackey-cms/server', '4. Droping database');
            promise = promise
                .then(() => {
                    return datasources.get('knex', 'default');
                })
                .then((knex) => {
                    return SCli.sql(knex.raw('drop schema public cascade;create schema public;'));
                }).then(() => {
                    SCli.log('lackey-cms/server', '4. Database dropped');
                });
        }
        return promise;
    }

    stop() {
        let self = this;
        return new BbPromise((resolve, reject) => {
            self._server.close((error) => {
                if (error) {
                    /* istanbul ignore next : it's too stupid to test */
                    return reject(error);
                }
                module.exports.instance = null;
                SCli.log('lackey-cms/server', 'Server fully closed');

                datasources.disconnect().then(() => {
                    resolve();
                });
            });
        });
    }

}

module.exports.instance = null;

module.exports = (event) => {

    SCli.asciiGreeting();
    SCli.log('lackey-cms/server', 'Starting site `' + event.site + '` in `' + event.stage + '`');

    return configFactory(event.site, event.stage).then((config) => {
        let server = new Server(config);
        module.exports.instance = server;

        return server;
    });

};
