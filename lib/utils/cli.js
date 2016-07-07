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

let os = require('os'),
  chalk = require('chalk'),
  bunyan = require('bunyan'),
  debug = require('debug'),
  PrettyStream = require('bunyan-prettystream'),
  clear = require('./clear'),
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


/**
 * ASCII Greeting
 */

exports.asciiGreeting = function () {

  let ver = require('../../package.json').version,
    art = '';

  art = art + ' _            _              ' + os.EOL;
  art = art + '| | __ _  ___| | _____ _   _ ' + os.EOL;
  art = art + '| |/ _` |/ __| |/ / _ \ | | |' + os.EOL;
  art = art + '| | (_| | (__|   <  __/ |_| |' + os.EOL;
  art = art + '|_|\__,_|\___|_|\_\___|\__, |' + os.EOL;
  art = art + '                       |___/ ' + os.EOL;
  art = art + 'More than a CMS v. ' + ver + os.EOL;
  console.log((typeof global.it !== 'function' ? clear : '') + chalk.yellow(art));
};


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


exports.error = function (error) {
  if(error.message) {
    console.log(chalk.red(error.message));
  } else {
    console.log(chalk.red(error));
  }
  console.log(chalk.red(error.stack));
  return Promise.resolve();
};
