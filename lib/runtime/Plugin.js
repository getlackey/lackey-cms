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
 * @module lackey-cms/runtime/Plugin
 * @see Based on https://raw.githubusercontent.com/serverless/serverless/master/lib/ServerlessPlugin.js
 */

const SError = require('../LackeyError'),
  SCli = require('../utils/cli'),
  BbPromise = require('bluebird');

/**
 * This is the base class that all Lackey Plugins should extend.
 */

class LackeyPlugin {

  /**
   * Constructor
   */

  constructor(S) {
    this.S = S;
  }

  /**
   * Define your plugins name
   */

  static getName() {
    return 'com.yourdomain.' + LackeyPlugin.name;
  }

  /**
   * Register Actions
   */

  registerActions() {
    return BbPromise.resolve();
  }

  /**
   * Register Hooks
   */

  registerHooks() {
    return BbPromise.resolve();
  }

  /**
   * CLI: Prompt Input
   * - Handy CLI Prompt Input function for Plugins
   * @param promptSchema @see https://github.com/flatiron/prompt#prompting-with-validation-default-values-and-more-complex-properties
   * @param overrides map
   * @returns {Promise} containing answers by key
   */

  cliPromptInput(promptSchema, overrides) {
    /* istanbul ignore if : interactive */
    if (this.S._interactive) { //CLI
      let Prompter = SCli.prompt();
      Prompter.override = overrides;
      return Prompter.getAsync(promptSchema);
    } else {
      return BbPromise.resolve(); //in non interactive mode. All options must be set programatically
    }
  }

  /**
   * CLI: Prompt Select
   * - Handy CLI Select Input function for Plugins
   * @param message string
   * @param choices
   * @param multi boolean
   * @param doneLabel string optional
   * @returns {Promise}
   */

  cliPromptSelect(message, choices, multi, doneLabel) {
    /* istanbul ignore if : interactive */
    if (this.S._interactive) { //CLI
      return SCli.select(message, choices, multi, doneLabel);
    } else if (this.S.isWebInterface) {
      /* istanbul ignore next : interactive */
      //TODO: implement
      return BbPromise.reject(new SError('Not implemented', SError.errorCodes.UNKNOWN));
    } else {
      return BbPromise.reject(new SError('You must specify all necessary options when in a non-interactive mode', SError.errorCodes.UNKNOWN));
    }
  }

  /**
   * CLI: Prompt Select Site
   */

  cliPromptSelectSite(message, site) {

    let _this = this,
      sites = Object.keys(_this.S.sites);

    // Resolve stage if provided
    if (site) return BbPromise.resolve(site);

    // Skip if not interactive
    if (!_this.S._interactive) return BbPromise.resolve();

    // if project has 1 stage, skip prompt
    /* istanbul ignore next : interactive */
    if (sites.length === 1) {
      return BbPromise.resolve(sites[0]);
    }

    // Create Choices
    /* istanbul ignore next : interactive */
      //TODO: implement
    let choices = [];
    /* istanbul ignore next : interactive */
    for (let i = 0; i < sites.length; i++) {
      choices.push({
        key: (i + 1) + ') ',
        value: sites[i],
        label: sites[i]
      });
    }
    /* istanbul ignore next : interactive */
      //TODO: implement
    return SCli.select(message, choices, false)
      .then(function (results) {
        return results[0].value;
      });
  }


}

module.exports = LackeyPlugin;
