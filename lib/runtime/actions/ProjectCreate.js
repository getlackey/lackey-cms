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
 * @module lackey-cms/runtime/actions/ProjectCreate
 */

/**
 * Plugin Factory
 * @param   {lackey-cms/runtime/Plugin} SPlugin
 * @param   {string} lackeyPath TODO: change to global
 * @returns {class} SiteRun
 */
/* istanbul ignore next : in progress */
module.exports = function (SPlugin, lackeyPath) {
    const path = require('path'),
        SError = require(path.join(lackeyPath, '../LackeyError')),
        BbPromise = require('bluebird'),
        SUtils = require(path.join(lackeyPath, '../utils')),
        SCli = require(path.join(lackeyPath, '../utils/cli')),
        fs = require('fs'),
        globCopy = require('glob-cp');

    /**
     * @class
     */
    class ProjectCreate extends SPlugin {

        /**
         * @constructs ProjectCreate
         * @param {object} S      runtime
         * @param {object} config
         */
        constructor(S, config) {
            super(S, config);
            this.evt = {};
        }

        /**
         * Define your plugins name
         * @returns {string}
         */
        static getName() {
            return 'lackey.core.' + ProjectCreate.name;
        }

        /**
         * @returns {Promise} upon completion of all registrations
         */
        registerActions() {
            this.S.addAction(this.projectCreate.bind(this), {
                handler: 'projectCreate',
                description: 'Creates project',
                context: 'project',
                contextAction: 'create',
                options: [
                    {
                        option: 'project',
                        shortcut: 'p',
                        description: 'project name'
          }
        ]
            });
            return BbPromise.resolve();
        }

        /**
         * Action
         * @param {object} evt
         * @returns {Promise}
         */
        projectCreate(evt) {
            let _this = this;

            if (evt) {
                _this.evt = evt;
                _this.S._interactive = false;
            }

            // If CLI, parse arguments
            /* istanbul ignore next : interactive */
            if (_this.S.cli) {

                _this.evt = JSON.parse(JSON.stringify(this.S.cli.options)); // Important: Clone objects, don't refer to them

            }

            return _this._prompt()
                .bind(_this)
                .then(_this._validateAndPrepare)
                .then(function (event) {

                    if (SUtils.isTest()) {
                        return event;
                    }

                    let projectName = event.project[Object.keys(event.project)[0]];
                    return _this._create(projectName);
                });
        }

        /**
         * Creates new project
         * @param {string} projectName
         */
        _create(projectName) {
            SCli.log('Creating project `' + projectName + '`');
            let projectDir = path.join(process.cwd(), projectName);
            return new BbPromise((resolve, reject) => {
                fs.stat(projectDir, (error) => {
                    if (error) {
                        if (error.code === 'ENOENT') {
                            return globCopy(path.join(lackeyPath, '../../boilerplate/*'), projectDir + '/*', {
                                recursive: true,
                                force: true
                            }, (err) => {
                                if (err) {
                                    return reject(err);
                                }
                                return resolve();
                            });
                        } else {
                            return reject(error);
                        }
                    }
                    reject('Path exists\n\n');
                });
            });
        }

        /**
         * Validate all data from event, interactive CLI or non interactive CLI
         * and prepare data
         * @private
         * @returns {Promise}
         */
        _validateAndPrepare() {
            let _this = this;


            // Check Params
            if (!_this.evt.project) {
                return BbPromise.reject(new SError('Missing project'));
            }

            return BbPromise.resolve(_this.evt);
        }

        /**
         * Prompt site
         * @private
         * @returns {Promise}
         */
        _prompt() {
            let _this = this;

            return _this.cliPromptInput('Select a project: ', _this.evt.project, true)
                .then(project => {
                    _this.evt.project = project;
                    BbPromise.resolve();
                });

        }

    }

    return (ProjectCreate);
};
