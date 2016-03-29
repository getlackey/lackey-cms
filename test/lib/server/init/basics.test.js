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

const should = require('should'),
    async = require('async'),
    Express = require('../../../mockup/express'),
    middleware = require('../../../../lib/server/init/basics');

describe('lib/server/init/basics', () => {
    it('Runs', () => {
        let express = new Express(),
            config = {
                get: (name) => {
                    return null;
                }
            };
        middleware(express, config);

        express._middleware.should.eql([
            'compress',
            'bodyParser.urlencoded',
            'bodyParser.json',
            'bodyParser.raw',
            'methodOverride',
            'cookieParser',
            'flash'
        ]);
        express._flags['jsonp callback'].should.be.eql(1);
        express._values.showStackError.should.be.eql(true);

    });
});
