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
const _ = require('lodash');

module.exports = _.merge({}, require('./default'), {
    isTest: true,
    name: 'Lackey CMS Default Test Config',
    datasources: {
        pg: {
            'default': {
                dsn: process.env.CI ? 'postgres://localhost:5433/lackey-cms-test'  : 'postgres://localhost/lackey-cms-test'
            }
        }
    },
    http: {
        port: 4444
    }
});
