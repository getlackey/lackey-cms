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

const SUtils = require('../../../lib/utils'),
    StdOutFixture = require('fixture-stdout'),
    BbPromise = require('bluebird'),
    async = require('async'),
        path = require('path'),
    should = require('should');

describe('lib/utils', () => {

    it('Site module', () => {
        SUtils.mod('default');
    });

    it('Project path', () => {
        SUtils.setProjectPath(null);
        SUtils.getProjectPath().should.be.eql(false);
        SUtils.setProjectPath(null);
        let current = process.cwd(),
        testPath = __dirname + '/../../../test/mockup/project/sites/default';
        process.chdir(testPath);
        SUtils.getProjectPath().should.be.eql(path.resolve(testPath + '/../..') + '/');
        SUtils.setProjectPath(null);
        process.chdir(path.resolve(testPath + '/../..'));
        SUtils.getProjectPath().should.be.eql(path.resolve(testPath + '/../..') + '/');
        process.chdir(current);
    });

    it('File Exists Sync', () => {
        SUtils.fileExistsSync(__dirname + '/utils.test.js').should.be.True;
    });

});
