/* jslint node:true, esnext:true, mocha:true, W030:false */
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

const
    Generator = require('../../../lib/generator'),
    lackey = require('../../../lib'),
    SUtils = require('../../../lib/utils'),
    configuration = require('../../../lib/configuration'),
      path = require('path'),
    should = require('should');

describe('lib/generator', () => {

    before(() => {
        configuration.unload();
        SUtils.setProjectPath(path.join(__dirname, '/../../../test/mockup/project/'));
        return configuration('test');
    });

    it('Loads', () => {
        return Generator
            .load(__dirname + '/../../../modules/users/module.yml')
            .then((doc) => {
                should.exist(doc);
                doc.should.be.Object;
                return true;
            });
    });

    it('Handle error', () => {
        return Generator
            .load(__dirname + '/../../../modules/users/notexistant.yml')
            .should.be.rejected();
    });

    it('Mappers', () => {

        Generator.registerMapper('Role', (list) => {
            return Promise.resolve(true);
        });

        return Generator
            .load(__dirname + '/../../../modules/users/module.yml')
            .then((doc) => {
                should.exist(doc);
                doc.should.be.Array;
                return true;
            });

    });

    it('Edge cases', () => {
        should.not.exist(Generator.map('User', null));
        should.not.exist(Generator.map('User', {
            stages: ['never-do-this']
        }, {
            get: () => 'other'
        }));
        return Generator
            .processInitData({
                WeDontHaveIt: [{}]
            })
            .then(result => {
                result.should.be.eql({
                    WeDontHaveIt: null
                });
            });
    });

    it('Includes', () => {
        return Generator
            .load(__dirname + '/../../../test/mockup/main.yml')
            .then((doc) => {
                should.exist(doc);
                return doc;
            })
            .should.finally.be.eql({
                field: [
                    123, 456
                ],
                other: [
                    789, '0ab', 'cde', 'fgh', 'ijk'
                ]
            });
    });

    after(() => {
        configuration.unload();
    });

});
