/* eslint no-underscore-dangle:0 */
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
/**
 * @module lackey-cms/datasources
 */
var knex = require('knex'),
    objection = require('objection'),
    SCli = require('../utils/cli'),
    compareVersion = require('compare-version'),
    __MODULE_NAME = 'lackey-cms/lib/datasources';

/**
 * PG Config Object
 * @typedef {Object} PgConfig
 * @property {string} dsn
 */

/**
 * Config Object
 * @typedef {Object} DBConfigObject
 * @property {Hash<String,PgConfig>} pg
 */

/**
 * @class
 */
class DataSourcesManager {
    /**
     * @constructs DataSourcesManager
     */
    constructor() {
        this._pool = {};
        this._resolvers = {};
        this._disconnects = {};
        this._cached = {};
    }

    /**
     * Connects to datasources
     * @param   {DBConfigObject}   config
     * @returns {Promise}
     */
    connect(config, drop) {
        return this
            ._connectPostgreses(config.pg, drop)
            .then((r) => {
                SCli.debug(__MODULE_NAME, 'Connected');
                return r;
            });
    }

    /**
     * Gets connection object
     * @param   {string} provider
     * @param   {string} connectionName
     * @returns {mixed|null}
     */
    get(provider, connectionName) {
        let self = this,
            promise = (this._pool[provider] || {})[connectionName];
        if (!promise) {
            SCli.debug(__MODULE_NAME, 'Creating new promsie for ' + provider + ' ' + connectionName);

            self._pool[provider] = self._pool[provider] || {};
            self._resolvers[provider] = self._resolvers[provider] || {};
            self._cached[provider] = self._cached[provider] || {};
            promise = new Promise((resolve) => {
                self._resolvers[provider][connectionName] = resolve;
            });
            self._pool[provider][connectionName] = promise;
        }
        return promise;
    }

    has(provider, connectionName) {
        return !!(this._pool[provider] || {})[connectionName];
    }

    cached(provider, connectionName) {
        SCli.debug(__MODULE_NAME, 'cached', provider, connectionName);
        return (this._cached[provider] || {})[connectionName];
    }

    /**
     * Sets connection object
     * @param   {string} provider
     * @param   {string} connectionName
     * @param   {object} connection
     * @returns {object} given connection
     */
    set(provider, connectionName, connection, disconnect) {
        SCli.debug(__MODULE_NAME, 'set', provider, connectionName);
        this.get(provider, connectionName); // set resolver
        this._cached[provider][connectionName] = connection;
        this._resolvers[provider][connectionName](connection);
        /* istanbul ignore next - no disconnectors used currently */
        if (disconnect) {

            this._disconnects[provider] = this._disconnects[provider] || {};
            this._disconnects[provider][connectionName] = disconnect;
        }
        return connection;
    }

    disconnect() {
        let promisess = [];
        /* istanbul ignore next - no disconnectors used currently */
        Object.keys(this._disconnects).forEach((provider) => {
            Object.keys(this._disconnects[provider]).forEach((connection) => {
                promisess.push(new Promise((resolve, reject) => {
                    this._disconnects[provider][connection]((error) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve();
                    });
                }));
            });
        });
        return Promise.all(promisess);
    }

    /**
     * Connects to PostgreSQL
     * @param   {Hash<String,PGDBConfig>} connections
     * @returns {Promise}
     */
    _connectPostgreses(connections, drop) {
        let promises = [],
            self = this;
        Object.keys(connections).forEach((connectionName) => {
            promises.push(self._connectPostgres(connectionName, connections[connectionName], drop));
        });
        return Promise.all(promises).then(function () {
            SCli.debug(__MODULE_NAME, 'All pg datasource connections created and connected');
            return true;
        });
    }

    /**
     * Connects to PG
     * @param   {string} connectionName
     * @param   {PGDBConfig}   config
     * @returns {Promise}
     */
    _connectPostgres(connectionName, config, drop) {
        let self = this;
        return new Promise((resolve, reject) => {
                let client = knex({
                    client: 'pg',
                    connection: config.dsn,
                    searchPath: 'public'
                });
                objection.Model.knex(client);
                return client
                    .raw('SELECT version()')
                    .then((result) => {
                        let version = result.rows[0].version.match(/\d+\.\d+\.\d+/);

                        /* istanbul ignore next */
                        if (compareVersion(version, '9.5') < 0) {
                            return reject(new Error('Wrong Postgres version ' + version));
                        }

                        if (!drop) {
                            return resolve(client);
                        }

                        SCli.log(__MODULE_NAME, 'Droping pg database for ' + connectionName);

                        SCli
                            .sql(client.raw('drop schema public cascade;create schema public;'))
                            .then(() => {
                                SCli.log(__MODULE_NAME, 'Database dropped');
                                setTimeout(() => {
                                    resolve(client);
                                }, 1000);
                            });
                    }, reject);
            })
            .then((client) => {
                self.set('knex', connectionName, client);
                return client;
            });

    }
}
module.exports = new DataSourcesManager();
