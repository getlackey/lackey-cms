/* eslint no-underscore-dangle:0 */
/* jslint node:true, esnext: true */
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

const nodemon = require('nodemon');

/**
 * @module lackey-cms/runtime/actions/SiteDebug
 */

/**
 * Plugin factory
 * @param   {lackey-cms/runtime/Plugin}       SPlugin
 * @param   {string}       lackeyPath path to lackey TODO: replace with global
 * @returns {class} SiteDebug
 */
module.exports = function (SPlugin, lackeyPath) {

  const path = require('path'),
    SError = require(path.join(lackeyPath, '../LackeyError')),
    BbPromise = require('bluebird'),
    SUtils = require(path.join(lackeyPath, '../utils'));

  /**
   * @class
   */
  class SiteDebug extends SPlugin {

    /**
     * @constructs SiteDebug
     * @extends lackey-cms/runtime/Plugin
     * @param {object} S      runtime
     * @param {object} config
     */
    constructor(S, config) {
      super(S, config);
      this.evt = {};
    }

    /**
     * Define your plugins name
     * @static
     * @returns {string}
     */
    static getName() {
      return 'lackey.core.' + SiteDebug.name;
    }

    /**
     * @returns {Promise} upon completion of all registrations
     */
    registerActions() {
      this.S.addAction(this.siteDebug.bind(this), {
        handler: 'siteDebug',
        description: `Runs specificed site in debug mode
Usage: lackey site run`,
        context: 'site',
        contextAction: 'debug',
        options: [
          {
            option: 'site',
            shortcut: 's',
            description: 'site id you want to use'
          },
          {
            option: 'stage',
            shortcut: 's',
            description: 'stage you want use'
          },
          {
            option: 'nonInteractive',
            shortcut: 'i',
            description: 'Optional - Turn off CLI interactivity if true. Default: false'
          }
        ]
      });
      return BbPromise.resolve();
    }

    /**
     * Action
     * @param {object} evt
     */
    siteDebug(evt) {
      let _this = this;

      if (evt) {
        _this.evt = evt;
        _this.S._interactive = false;
      }

      // If CLI, parse arguments
      /* istanbul ignore next : interactive */
      if (_this.S.cli) {

        _this.evt = JSON.parse(JSON.stringify(this.S.cli.options)); // Important: Clone objects, don't refer to them

        if (_this.S.cli.options.nonInteractive) {
          _this.S._interactive = false;
        }
      }

      return _this.S.validateProject()
        .bind(_this)
        .then(_this._prompt)
        .then(_this._validateAndPrepare)
        .then(function () {

          let config = {
            exec: 'node --harmony',
            script: path.join(lackeyPath, '../server/debug.js'),
            ext: 'js json sass yml scss',
            stdout: true,
            debug: true,
            ignore: ['*/htdocs/*'],
            ignoreRoot: ['.git']
          };

          if (SUtils.isTest()) {
            return config;
          }

          /* istanbul ignore next : running app */
          nodemon(config);
          /* istanbul ignore next : running app */
          nodemon.on('start', function () {
            console.log('App has started');
          }).on('quit', function () {
            console.log('App has quit');
          }).on('restart', function (files) {
            console.log('App restarted due to: ', files);
          });
          /* istanbul ignore next : running app */
          return true;
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

      _this.evt.stage = _this.evt.stage || 'development';

      // non interactive validation
      if (!_this.S._interactive) {

        // Check Params
        if (!_this.evt.site) {
          return BbPromise.reject(new SError('Missing site or stage'));
        }
      }

      return BbPromise.resolve(_this.evt);
    }

    /**
     * Prompt site
     * @returns {Promise}
     */
    /* istanbul ignore next : interactive */
    _prompt() {
      let _this = this;

      return _this.cliPromptSelectSite('Select a site to run: ', _this.evt.site, true)
        .then(site => {
          _this.evt.site = site;
          BbPromise.resolve();
        });

    }

  }

  return (SiteDebug);
};
