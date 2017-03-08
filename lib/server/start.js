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

if (!global.LACKEY_PATH) {
    /* istanbul ignore next */
    global.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/..';
}

try {
    if (process.env.NODE_ENV) {
        require('newrelic');
    }
} catch (e) {
    console.log(e);
}

/* istanbul ignore next */
let server = require('./index'),
    SCli = require('../utils/cli');
/* istanbul ignore next */
server({
        stage: process.env.NODE_ENV || 'development'
    })
    .then((instance) => {
        return instance.init();
    }, (error) => {
        SCli.error(error);
    });
