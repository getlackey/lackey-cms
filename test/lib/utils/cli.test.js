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

const SCli = require('../../../lib/utils/cli'),
    StdOutFixture = require('fixture-stdout'),
    packageJSON = require('../../../package.json'),
    should = require('should');

describe('lib/utils/cli', () => {

    it('asciiGreeting', () => {

        let fixture = new StdOutFixture(),
            cache = '';
        fixture.capture(function onWrite(string, encoding, fd) {
            cache += string;
            return false;
        });
        SCli.asciiGreeting();
        fixture.release();
        cache.should.be.eql('\u001b[33m _            _              \n| | __ _  ___| | _____ _   _ \n| |/ _` |/ __| |/ / _  | | |\n| | (_| | (__|   <  __/ |_| |\n|_|__,_|___|_|____|__, |\n                       |___/ \nMore than a CMS v. ' + packageJSON.version + '\n\u001b[39m\n');
    });

    it('error', () => {
        let fixture = new StdOutFixture(),
            cache = '',
            promise;
        fixture.capture(function onWrite(string, encoding, fd) {
            cache += string;
            return false;
        });
        promise = SCli.error('Teletubies!');
        fixture.release();
        cache.should.be.eql('\u001b[31mTeletubies!\u001b[39m\n\u001b[31mundefined\u001b[39m\n');
        promise.should.be.rejected().then(()=>{},()=>{});
    });
});
