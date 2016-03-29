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
 * Based on https://github.com/serverless/serverless/blob/master/lib/utils/cli.js
 */


/**
 * Lackey: CLI
 */

let Promise = require('bluebird'),
  prompt = require('prompt'),
  os = require('os'),
  SError = require('../LackeyError'),
  utils = require('../utils'),
  fs = require('fs'),
  chalk = require('chalk'),
  Spinner = require('cli-spinner').Spinner,
  keypress = require('keypress'),
  bunyan = require('bunyan'),
  debug = require('debug'),
  PrettyStream = require('bunyan-prettystream'),
  prettyStdOut = new PrettyStream(),
  logger = bunyan.createLogger({
    name: 'lackey',
    streams: [{
      level: 'info',
      type: 'raw',
      stream: prettyStdOut
          }]
  });

prettyStdOut.pipe(process.stdout);

Promise.promisifyAll(fs);
Promise.promisifyAll(prompt);

/**
 * ASCII Greeting
 */

exports.asciiGreeting = function () {
  let ver = require('../../package.json').version;

  let art = '';
  art = art + ' _            _              ' + os.EOL;
  art = art + '| | __ _  ___| | _____ _   _ ' + os.EOL;
  art = art + '| |/ _` |/ __| |/ / _ \ | | |' + os.EOL;
  art = art + '| | (_| | (__|   <  __/ |_| |' + os.EOL;
  art = art + '|_|\__,_|\___|_|\_\___|\__, |' + os.EOL;
  art = art + '                       |___/ ' + os.EOL;
  art = art + 'More than a CMS v. ' + ver + os.EOL;
  console.log(chalk.yellow(art));
};

/**
 * Spinner
 */
/* istanbul ignore next : interactive */
exports.spinner = function (message) {
  let _this = this,
    spinner;

  if (_this.isInteractive()) {
    spinner = new Spinner('Lackey: ' + chalk.yellow('%s ' + (message ? message : '')));
    spinner.setSpinnerString('|/-\\');
  } else {

    // Non-interactive spinner object
    spinner = {
      start: function (msg) {
        let messg = msg || 'Loading... ';
        process.stdout.write(`Lackey: ${messg}`);
      },
      stop: function (msg) {
        let messg = msg;
        // Because of how spinner is used with normal library
        // we do a small hack and still allow for setting message
        if (msg === true || msg === false) {
          messg = 'Done!\n';
        }

        messg = messg || 'Done!\n';
        process.stdout.write(messg);

      }
    };
  }

  return spinner;
};

/**
 * Log
 */

exports.log = function () {
  logger.info.apply(logger, arguments);
};

let debuggers = {};

exports.debug = function () {
  let array = [].slice.call(arguments),
    label = 'lackey';
  if (array.length > 0) {
    label = array.shift();
  }
  if (!debuggers[label]) {
    debuggers[label] = debug(label);
  }
  debuggers[label](array.join(', '));
};

exports.sql = function (query) {
  if (!debuggers.sql) {
    debuggers.sql = debug('sql');
  }
  debuggers.sql(query.toString());
  return query;
};

/* istanbul ignore next : logger */
exports.warn = function () {
  logger.warn.apply(logger, arguments);
};

exports.logger = function () {
  return logger;
};

/**
 * Prompt
 */
/* istanbul ignore next : interactive */
exports.prompt = function () {
  prompt.start();
  prompt.delimiter = '';
  prompt.message = 'Lackey: ';
  return prompt;
};

/**
 * Command validator
 */
/* istanbul ignore next : interactive */
exports.validateCmd = function (option, validOptions) {
  if (validOptions.indexOf(option) === -1) {
    console.log('Unsupported command "' + option + '". Valid command(s): ' + validOptions.join(', '));
    return false;
  } else {
    return true;
  }
};

/**
 * isTTY Determines if we have Interactive Terminal
 */
/* istanbul ignore next : interactive */
exports.isInteractive = function () {
  return process.stdout.isTTY && !process.env.CI;
};

/**
 * Prompt: Select
 *
 * Accepts array: {key: '1: ', key2: '(deployed) ', value: 'a great choice!'}
 * Or: {spacer: '-----'}
 * @returns {Promise}
 */

let Select = {
  data: null
};

// Render
/* istanbul ignore next : interactive */
Select._render = function () {

  let _this = this;

  // Clear Rendering
  _this._clear();

  // Reset line count
  _this.state.lines = 1;

  // Render Line
  for (let i = 0; i < _this.state.choices.length; i++) {

    let choice = _this.state.choices[i],
      line = '';

    // Increment line count
    _this.state.lines++;

    // Select Arrow
    let arrow = i === (_this.state.index - 1) ? '  > ' : '    ';

    // Render Choice
    if (choice.label) {
      // Line - Key
      if (choice.key) {
        line = line + choice.key;
      }
      // Line - Key2
      if (choice.key2) {
        line = line + choice.key2;
      }
      // Line - Line
      line = line + choice.label;
      // Add toggled style
      if (choice.toggled) {
        line = chalk.yellow(line);
      }
      // Add line break
      line = line + os.EOL;
    }

    // Render Spacer
    if (choice.spacer) {
      line = chalk.grey(choice.spacer) + os.EOL;
    }

    // TODO: Add custom word wrap after measuring terminal width. Re-count lines.

    // Render
    process.stdout.write(arrow + line);
  }
};

// Private: Clear Rendering
/* istanbul ignore next : interactive */
Select._clear = function () {

  for (let i = 1; i < Select.state.lines; i++) {
    process.stdout.moveCursor(0, -1);
    process.stdout.clearLine();
  }
};

// Private: Close
/* istanbul ignore next : interactive */
Select._close = function () {
  utils.sDebug('Closing select listener');
  let _this = this;

  process.stdin.pause();

  // Gather Choices
  let selected = [];
  for (let i = 0; i < _this.state.choices.length; i++) {
    if (_this.state.choices[i].toggled) {
      selected.push(_this.state.choices[i]);
    }
  }

  return Select._promise(selected);
};

/**
 * Select
 */
/* istanbul ignore next : interactive */
exports.select = function (message, choices, multi, doneLabel) {

  let _this = this;

  if (!_this.isInteractive()) {
    throw new SError('You must specify all necessary options when in a non-interactive mode.');
  }

  // Set keypress listener, if not set
  if (!Select.state) {
    keypress(process.stdin);
  }

  let keypressHandler = function (ch, key) {

    if (!key) {
      return Select._render;
    }

    if (key && key.ctrl && key.name === 'c') {
      process.stdin.pause();

    } else if (key.name === 'up' && Select.state.index > 1) {

      if (Select.state.index === 2 && Select.state.choices[0].spacer) {

        // If first choice is spacer, do nothing
        Select.state.index = 2;

      } else if (Select.state.choices[Select.state.index - 2].spacer) {

        // If next choice is spacer, move up 2
        Select.state.index = Select.state.index - 2;

      } else {

        // Move up
        Select.state.index = Select.state.index - 1;

      }

      // Render
      return Select._render();

    } else if (key.name === 'down' && Select.state.index < Select.state.choices.length) {

      if (Select.state.choices[Select.state.index].spacer) {

        // If next choice is spacer, move down 2
        Select.state.index = Select.state.index + 2;

      } else {

        // Move down
        Select.state.index = Select.state.index + 1;

      }

      // Render
      return Select._render();

    } else if (key.name === 'return') {

      // Check if "done" option
      if (Select.state.choices[Select.state.index - 1].action && Select.state.choices[Select.state.index - 1].action.toLowerCase() === 'done') {
        process.stdin.removeListener('keypress', keypressHandler);
        return Select._close();
      } else {

        // Toggle option
        Select.state.choices[Select.state.index - 1].toggled = Select.state.choices[Select.state.index - 1].toggled ? false : true;

        if (!Select.state.multi) {
          process.stdin.removeListener('keypress', keypressHandler);
          Select._close();
        } else {
          return Select._render();
        }
      }
    }
  };

  process.stdin.on('keypress', keypressHandler);
  process.stdin.setRawMode(true);

  return new Promise(function (resolve) {

    // Resume stdin
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    // Update CheckList
    Select.state = {
      choices: choices,
      index: (choices[0] && choices[0].spacer) ? 2 : 1,
      lines: 0,
      multi: multi,
      doneLabel: doneLabel ? doneLabel : 'Done'
    };

    // Add Done and Cancel to choices
    if (Select.state.multi) {
      Select.state.choices.push({
        spacer: '- - - - -'
      }, {
        action: 'Done',
        label: Select.state.doneLabel
      });
    }

    // Log Message
    if (message) {
      console.log('Lackey: ' + chalk.yellow(message));
    }

    // Assign CheckList Promise
    Select._promise = resolve;

    // Initial Render
    Select._render();
  });
};

/**
 * Generate Main Help
 */
/* istanbul ignore next : interactive */
exports.generateMainHelp = function (allCommands) {

  this.asciiGreeting();

  console.log(chalk.yellow.underline('\nCommands'));
  console.log(chalk.dim('* Lackey documentation: http://...'));
  console.log(chalk.dim('* You can run commands with "lackey" or the shortcut "lky"'));
  console.log(chalk.dim('* Pass "--help" after any <context> <action> for contextual help'));

  for (let cmdContext in allCommands) {
    console.log(chalk.bgBlack('\n"%s" actions:'), cmdContext);
    for (let cmdAction in allCommands[cmdContext]) {
      console.log(chalk.yellow('  %s'), cmdAction);
    }
  }

  console.log('');

  return Promise.resolve();
};

exports.error = function (error) {

  console.log(chalk.red(error));
  console.log(chalk.red(error.stack));
  return Promise.resolve();
};

/**
 * Generate Context Help
 */
/* istanbul ignore next : interactive */
exports.generateContextHelp = function (cmdContext, allCommands) {
  console.log(chalk.dim('Note: pass "--help" after any <context> <action> for contextual help'));
  console.log(chalk.yellow.underline('\n"%s" command actions:'), cmdContext);

  for (let cmdAction in allCommands[cmdContext]) {
    console.log(chalk.bgBlack('\n%s'), cmdAction);
  }

  return Promise.resolve();
};

/**
 * Generate Action Help
 */
/* istanbul ignore next : interactive */
exports.generateActionHelp = function (cmdConfig) {
  console.log(chalk.yellow('%s'), cmdConfig.description);

  console.log('');

  for (let opt of cmdConfig.options) {
    console.log(chalk.yellow('  -%s, --%s \n\t%s'), opt.shortcut, opt.option, opt.description);
    console.log('');
  }

  return Promise.resolve();
};
