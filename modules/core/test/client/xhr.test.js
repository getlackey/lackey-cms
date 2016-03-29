/* jslint esnext:true, node:true, mocha:true */
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
const api = require('../../client/js/xhr'),
    XMLHttpRequest = require('../../../../test/mockup/xhr'),
    should = require('should');

describe('modules/core/client/xhr', () => {

    before(() => {
        GLOBAL.XMLHttpRequest = XMLHttpRequest;
    });

    it('GET /echo', () => {
        let path = '',
            method = '';
        XMLHttpRequest.respond = function (callback) {
            path = this._uri;
            method = this._method;
            callback();
        };
        return api.get('/echo').then(() => {
            path.should.be.eql('/echo');
            method.should.be.eql('get');
            return true;
        }).should.finally.be.eql(true);
    });

    it('any 204', () => {
        let path = '',
            method = '';
        XMLHttpRequest.respond = function (callback) {
            path = this._uri;
            method = this._method;
            this.status = '204';
            callback();
        };
        return api.ajax('/echo', 'get').then((response) => {
            path.should.be.eql('/echo');
            method.should.be.eql('get');
            should.not.exist(response);
            return true;
        }).should.finally.be.eql(true);
    });

    it('handle error', () => {
        let path = '',
            method = '';
        XMLHttpRequest.respond = function (callback) {
            path = this._uri;
            method = this._method;
            this.status = '404';
            callback();
        };
        return api.ajax('/echo', 'get').then(() => {
            /* istanbul ignore next : i don't want to test this */
            throw new Error('shouldn\'t be here');
        }, (error) => {
            if(error.message !== 'Error: 404') {
                /* istanbul ignore next : i don't want to test this */
                return true;
            }
            throw error;
        }).should.be.rejected();
    });

    it('POST /echo', () => {
        let path = '',
            method = '',
            data = {
                a: 1,
                b: [{
                    c: 'afafdsfads'
                    }]
            },
            post = null;
        XMLHttpRequest.respond = function (callback) {
            path = this._uri;
            method = this._method;
            post = this._data;
            callback();
        };
        return api.post('/echo', data).then(() => {
            path.should.be.eql('/echo');
            method.should.be.eql('post');
            should.exists(post);
            JSON.parse(post).should.be.eql(data);
            return true;
        }).should.finally.be.eql(true);
    });

    it('PUT /echo', () => {
        let path = '',
            method = '',
            data = {
                a: 1,
                b: [{
                    c: 'afafdsfads'
                    }]
            },
            post = null;
        XMLHttpRequest.respond = function (callback) {
            path = this._uri;
            method = this._method;
            post = this._data;
            callback();
        };
        return api.put('/echo/123', data).then(() => {
            path.should.be.eql('/echo/123');
            method.should.be.eql('put');
            should.exists(post);
            JSON.parse(post).should.be.eql(data);
            return true;
        }).should.finally.be.eql(true);
    });

    it('DELETE /echo/123', () => {
        let path = '',
            method = '';
        XMLHttpRequest.respond = function (callback) {
            path = this._uri;
            method = this._method;
            callback();
        };
        return api.delete('/echo/123').then(() => {
            path.should.be.eql('/echo/123');
            method.should.be.eql('delete');
            return true;
        }).should.finally.be.eql(true);
    });

    after(() => {
        GLOBAL.XMLHttpRequest = null;
    });
});
