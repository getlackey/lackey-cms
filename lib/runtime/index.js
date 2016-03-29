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

/**
 * @module lackey-cms/runtime
 * @see Based on https://github.com/serverless/serverless/blob/master/lib/Serverless.js
 */

require('shelljs/global');

const path = require('path'),
  SUtils = require('../utils'),
  SError = require('../LackeyError'),
  SPlugin = require('./Plugin'),
  fs = require('fs'),
  SCli = require('../utils/cli'),
  BbPromise = require('bluebird');

// Global Bluebird Config
/* istanbul ignore next */
BbPromise.onPossiblyUnhandledRejection(function (error) {
  SCli.error(error);
  throw error;
});
BbPromise.longStackTraces();


/**
 * @class
 */
class Lackey {

  /**
   * Runtime contstructor
   * @constructs Lackey
   * @param {object} config
   */
  constructor(config) {

    let configuration = config ? config : {};

    // Add Defaults
    this._interactive = (configuration.interactive !== undefined) ? configuration.interactive : (process.stdout.isTTY && !process.env.CI);
    this._projectPath = configuration.projectPath || SUtils.getProjectPath();
    this._lackeyPath = SUtils.getLackeyPath();

    this._version = require(this._lackeyPath + 'package.json').version;
    this.commands = {};
    this.hooks = {};
    this.actions = {};
    this.sites = {};

    let defaults = require('./actions.json');
    if (this._projectPath) {
      this._loadSites(this._projectPath + 'sites');
    }
    this._loadPlugins(__dirname, defaults.plugins);

  }

  /**
   * Add Plugin
   * @param {lackey-cms/runtime/Plugin} ServerlessPlugin class object
   * @returns {Promise}
   */

  addPlugin(ServerlessPlugin) {
    return BbPromise.all([
      ServerlessPlugin.registerActions(),
      ServerlessPlugin.registerHooks()
    ]);
  }

  /**
   * Add action
   * @param action     must   return an ES6 BbPromise that is resolved or rejected
   * @param config
   */

  addAction(action, config) {

    let _this = this;

    // Add Hooks Array
    this.hooks[config.handler + 'Pre'] = [];
    this.hooks[config.handler + 'Post'] = [];

    // Add Action
    /* istanbul ignore next : don't want to test it */
    this.actions[config.handler] = function (evt) {

      // Add pre hooks, action, then post hooks to queued
      let queue = _this.hooks[config.handler + 'Pre'];

      // Prevent duplicate actions from being added
      if (queue.indexOf(action) === -1) queue.push(action);

      queue = queue.concat(_this.hooks[config.handler + 'Post']);

      // Create promise chain
      let chain = queue.reduce(function (previous, current) {
        return previous.then(current);
      }, BbPromise.resolve(evt));

      return chain;
    };

    // Add command
    if (config.context && config.contextAction) {
      if (!this.commands[config.context]) {
        this.commands[config.context] = {};
      }

      this.commands[config.context][config.contextAction] = config;
    }
  }

  /**
   * Command
   * @param argv
   * @returns {Promise}
   */

  command(argv) {

    // Set Debug to True
    if (argv && argv.d) process.env.DEBUG = true;

    SUtils.sDebug('Command raw argv: ', argv);

    // Handle version command
    /* istanbul ignore next */
    if (argv._[0] === 'version') {
      console.log('Version', this._version);
      return BbPromise.resolve();
    }

    let cmdContext = argv._[0],
      cmdContextAction = argv._[1];

    this.cli = {}; // Options and args that the command was called with on the CLI so plugins can leverage

    if (argv._.length === 0 || argv._[0] === 'help' || argv._[0] === 'h') {
      if (!this.commands[cmdContext]) {
        return SCli.generateMainHelp(this.commands);
      } else /* istanbul ignore next */ if (this.commands[cmdContext] && !this.commands[cmdContext][cmdContextAction]) {
        return SCli.generateContextHelp(cmdContext, this.commands);
      }
      // If context AND contextAction passed with help need the cmdConfig (below)
    } else /* istanbul ignore next */ if (!this.commands[cmdContext] || !this.commands[cmdContext][cmdContextAction]) {
      return BbPromise.reject(new SError('Command Not Found', SError.errorCodes.UNKNOWN));
    }
    /* istanbul ignore next */
    let cmdConfig = this.commands[cmdContext][cmdContextAction],
      opts = {},
      params = argv._.filter(v => {
        /* istanbul ignore next */
        // Remove context and contextAction strings from non opt args
        return ([cmdConfig.context, cmdConfig.contextAction].indexOf(v) === -1);
      });

    /* istanbul ignore next */
    cmdConfig.options.map(opt => {
      opts[opt.option] = (argv[opt.option] ? argv[opt.option] : (argv[opt.shortcut] || null));
    });

    /* istanbul ignore next */
    SUtils.sDebug('opts', opts);
    /* istanbul ignore next */
    SUtils.sDebug('argv._', argv._);
    /* istanbul ignore next */
    SUtils.sDebug('non opt args', params);

    /* istanbul ignore next */
    if (argv.help || argv.h) {
      return SCli.generateActionHelp(cmdConfig);
    }

    /* istanbul ignore next */
    this.cli.context = cmdConfig.context;
    /* istanbul ignore next */
    this.cli.contextAction = cmdConfig.contextAction;
    /* istanbul ignore next */
    this.cli.options = opts;
    /* istanbul ignore next */
    this.cli.params = params;
    /* istanbul ignore next */
    this.cli.rawArgv = argv;
    /* istanbul ignore next */
    return this.actions[cmdConfig.handler].apply(this, {});
  }

  /**
   * Validate Project
   * Ensures:
   */

  validateProject() {
    /* istanbul ignore next : don't want to test it */
    return BbPromise.resolve();
  }

  /**
   * Load Plugins
   * @param relDir string path to start from when rel paths are specified
   * @param pluginMetadata
   * @private
   */

  _loadPlugins(relDir, pluginMetadata) {

    let _this = this;

    for (let pluginMetadatum of pluginMetadata) {

      // Find Plugin
      let pluginClass,
        PluginClass;
      if (pluginMetadatum.path.indexOf('.') === 0) {

        // Load non-npm plugin from the project plugins folder
        let pluginAbsPath = path.join(relDir, pluginMetadatum.path);
        SUtils.sDebug('Attempting to load plugin from ' + pluginAbsPath);
        pluginClass = require(pluginAbsPath);
        pluginClass = pluginClass(SPlugin, __dirname);
      } else
      // Load plugin from either custom or node_modules in plugins folder
      /* istanbul ignore next : don't want to test it */
      if (SUtils.dirExistsSync(path.join(relDir, 'plugins', 'custom', pluginMetadatum.path))) {
        pluginClass = require(path.join(relDir, 'plugins', 'custom', pluginMetadatum.path));
        pluginClass = pluginClass(SPlugin, __dirname);
      } else if (SUtils.dirExistsSync(path.join(relDir, 'plugins', 'node_modules', pluginMetadatum.path))) {
        pluginClass = require(path.join(relDir, 'plugins', 'node_modules', pluginMetadatum.path));
        pluginClass = pluginClass(SPlugin, __dirname);
      }


      // Load Plugin
      if (!pluginClass) {
        /* istanbul ignore next : don't want to test it */
        console.log('WARNING: This plugin was requested by this project but could not be found: ' + pluginMetadatum.path);
      } else {
        SUtils.sDebug(pluginClass.getName() + ' plugin loaded');
        PluginClass = pluginClass;
        this.addPlugin(new PluginClass(_this));
      }
    }
  }

  /**
   * @private
   * @param {string} siteDir
   */
  _loadSites(siteDir) {
    let _this = this,
      list = fs.readdirSync(siteDir);

    list.forEach(function (name) {
      _this.sites[name] = {};
    });
  }

}

module.exports = Lackey;
