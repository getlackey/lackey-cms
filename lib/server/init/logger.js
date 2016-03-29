/*jslint node:true, nomen:true, esnext:true */
'use strict';
/*
    Copyright 2015 Enigma Marketing Services Limited

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


const logger = require('express-bunyan-logger'),
    PrettyStream = require('bunyan-prettystream'),
    SCli = require('../../utils/cli');

module.exports = function (server, config) {

    SCli.debug('lackey-cms/server/init/logger', 'Setting up');

    let prettyStdOut = new PrettyStream();
    prettyStdOut.pipe(process.stdout);

    if (!process.env.NO_HTTP_DEBUG) {
        /* istanbul ignore next */
        server.use(logger({
            name: 'HTTP ' + config.get('name'),
            streams: [{
                level: 'debug',
                type: 'raw',
                stream: prettyStdOut
          }]
        }));
    }
};
