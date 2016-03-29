/* jslint node:true, esnext:true, mocha:true */
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

const Runtime = require('../../../lib/runtime'),
    StdOutFixture = require('fixture-stdout');


describe('lib/runtime', () => {

    let options = {
        projectPath: __dirname + '/../../../test/mockup/project/'
    };

    it('Creates', () => {
        new Runtime(options);
    });

    it('Runns command', () => {
        let fixture = new StdOutFixture();
        fixture.capture(function onWrite() {
            return false;
        });
        new Runtime(options).command({
            _: ['help'],
            d: true,

        });
        fixture.release();
    });
});
