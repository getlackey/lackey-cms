/* jslint node:true, esnext:true, mocha:true */
'use strict';
/*
    Copyright 2016 Enigma Marketing Services Limited

    Licensed under the Apache License, Version 2.0 (the 'License');
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an 'AS IS' BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

const should = require('should'),
    resolve = require('../../client/js/iframe.resolve.js');

describe('modules/cms/client/js/iframe.resolve', () => {

    it('Just domain', () => {
        resolve('http://example.com', '').should.be.eql('http://example.com/admin');
    });

    it('Domain and path', () => {
        resolve('http://example.com', '/haba-baba/ouc').should.be.eql('http://example.com/admin/haba-baba/ouc');
    });

    it('Just domain with prefix', () => {
        resolve('http://example.com/prefix', '/prefix').should.be.eql('http://example.com/prefix/admin');
    });

    it('Domain with prfix and path', () => {
        resolve('http://example.com/prefix', '/prefix/haba-baba/ouc').should.be.eql('http://example.com/prefix/admin/haba-baba/ouc');
    });

    it('Symantec example', () => {
        resolve('https://wspp.symantec.com/partnerlink/', '/partnerlink').should.be.eql('https://wspp.symantec.com/partnerlink/admin');
        resolve('https://wspp.symantec.com/partnerlink/', '/partnerlink/whatever').should.be.eql('https://wspp.symantec.com/partnerlink/admin/whatever');
    });


});
