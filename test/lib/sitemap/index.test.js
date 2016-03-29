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

const dbsInit = require('../../../test/mockup/dbs'),
    BbPromise = require('bluebird'),
    should = require('should');

describe('lib/sitemap', () => {

    let sitemap;

    before((done) => {
        dbsInit(() => {
            sitemap = require('../../../lib/sitemap');
            done();
        });
    });

    it('Works', () => {

        let counts = 0,
            source = () => {
                return new BbPromise((resolve) => {
                    resolve([++counts, ++counts]);
                });
            }

        sitemap.flush();

        return sitemap.refresh().then((results) => {
            results.length.should.be.eql(0);
            sitemap.addSource(source);
            return sitemap.refresh();
        }).then((results) => {
            results.should.be.eql([1, 2]);
            counts.should.be.eql(2);
            results = sitemap.getCached();
            results.should.be.eql([1, 2]);
            counts.should.be.eql(2);
            sitemap.addSource(source);
            return sitemap.refresh();
        }).then((results) => {
            results.should.be.eql([3, 4, 5, 6]);
            counts.should.be.eql(6);
            return true;
        }).should.finally.be.eql(true);

    });
});
