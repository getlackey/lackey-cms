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
    sitemap = require('../sitemap'),
    socketIO = require('socket.io'),
    Bindable = require('../utils/bindable'),
    __MODULE_NAME = 'lackey-cms/server';

class Server extends Bindable {

    constructor(config) {
        super();
        SCli.debug(__MODULE_NAME, 'Server instance created');
        this._config = config;
        let htdocs = SUtils.getProjectPath() + '/htdocs';
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
        this._dustHelpers = [];
        this._socketWares = [];
        this._started = false;

    }

    init() {
        SCli.log(__MODULE_NAME, '1. Loading config');
        return Promise.resolve()
            .then(this.bind(this._loadModules))
            .then(this.bind(this._loadDataSources))
            .then(this.bind(this._setupExpress))
            .then(this.bind((server) => {
                this._express = server;
                return server;
            }))
            .then(this.bind(this._initModules))
            .then(this.bind(this._listen))
            .then(this.bind(this._capture))
            .catch((error) => {
                SCli.error(error);
            });

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

    addSocketware(socketWare) {
        if (this._started) {
            /* istanbul ignore next : it's too stupid to test */
            throw new Error('Express already started');
        }
        this._socketWares.push(socketWare);
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

    _capture() {
        SCli.log(__MODULE_NAME, '8. Capture SIGINT');
        let _this = this;

        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(false); // disable this all CLI nonsense
        }
        /* istanbul ignore next : interactive */
        process.on('SIGINT', () => {
            process.removeAllListeners('SIGINT');
            SCli.log(__MODULE_NAME, 'Gracefull exit');
            _this._server.close(() => {
                // todo close databases
                process.exit();
            });
        });

        return this;

    }

    _listen() {
        SCli.log(__MODULE_NAME, '6. Listen');

        let self = this;

        this._postwares.forEach((postware) => {
            this._express.use(postware);
        });

        errors(this._express, this._config);

        return SUtils
            .serialPromise(this._socketWares, (socketware) => socketware) // wait for promissed socketwares
            .then((socketwares) => {

                return new Promise((resolve, reject) => {

                    let port = self._config.get('http.port'),
                        server,
                        base = self._config.get('host'),
                        cleanBase = base ? base.replace(/([^\/]{1})\/$/, '$1') : 'http://localhost',
                        prefix = cleanBase.replace(/^.+?:\/\/[^\/]+(.*)$/, '$1'),
                        prefixed = !!(prefix && prefix.length);

                    SCli.log(__MODULE_NAME, '7. Will listen to ' + port + ' node PORT env is equal ' + process.env.PORT);

                    server = self._express.listen(port, (err) => {

                        if (err) {
                            /* istanbul ignore next : it's too stupid to test */
                            return reject(err);
                        }

                        let host = server.address().address,
                            listeningPort = server.address().port,
                            connection;

                        self._server = server;

                        connection = socketIO.listen(server);

                        self._socket = prefixed ? connection.of(prefix + '/') : connection.sockets;

                        (prefixed ? self._socket : connection)
                        .on('connection', (_socket) => {
                            socketwares.forEach((socketWare) => {
                                socketWare(_socket, self._config);
                            });
                        });

                        sitemap.refresh();

                        SCli.debug(__MODULE_NAME, 'App listening to `' + host + '` at `' + listeningPort + '`');
                        resolve(server);
                    });
                });
            });


    }

    originIsAllowed() {
        // put logic here to detect whether the specified origin is allowed.
        return true;
    }

    _setupExpress() {
        SCli.log(__MODULE_NAME, '4. Setting express');

        let host = this._config.get('host');

        this._middlewares.splice(0, 0, (server) => {
            server.use((req, res, next) => {
                req.__host = host.replace(/\/$/, '');
                next();
            });
        });

        return express(this._config, this._middlewares)
            .then(result => {
                this._express = result;
                return this._express;
            });
    }

    _initModules() {

        SCli.log(__MODULE_NAME, '5. Initing modules');
        let _this = this,
            current = Promise.resolve();

        moduleLoader
            .list()
            .forEach((module) => {
                current = current
                    .then(() => moduleLoader.loadModels(module));
            });

        moduleLoader
            .list()
            .forEach((module) => {
                current = current
                    .then(() => moduleLoader.loadInitData(module));
            });

        moduleLoader
            .list()
            .forEach((module) => {
                current = current
                    .then(() => moduleLoader.loadRoutes(module, _this._express));
            });

        if (_this._postRouteWare.length) {
            current = current
                .then(() => {
                    return SUtils
                        .serialPromise(_this._postRouteWare, (middleware) => {
                            return middleware(_this._express);
                        });
                });
        }
        return current;
    }

    _loadModules() {
        SCli.log(__MODULE_NAME, '2. Loading modules');
        return moduleLoader(this, this._config);
    }

    _loadDataSources() {
        SCli.log(__MODULE_NAME, '3. Loading data sources');
        return datasources
            .connect(this._config.get('datasources'), (this._config.get('yml.drop') === true));
    }

    stop() {
        let self = this;
        return new Promise((resolve, reject) => {
            self._server.close((error) => {
                if (error) {
                    /* istanbul ignore next : it's too stupid to test */
                    return reject(error);
                }
                moduleLoader.cleanup();
                module.exports.instance = null;
                SCli.log(__MODULE_NAME, 'Server fully closed');

                datasources.disconnect().then(() => {
                    resolve();
                });
            });
        });
    }

}

module.exports.instance = null;

module.exports = (event, override) => {

    SCli.asciiGreeting();
    SCli.log(__MODULE_NAME, 'Starting site in `' + event.stage + '`');

    return configFactory(event.stage, override)
        .then((config) => {
            if (!config) {
                throw new Error('No config found');
            }

            let server = new Server(config);
            module.exports.instance = server;
            return server;
        });

};
