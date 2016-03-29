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

const
    dbsInit = require('../../../../test/mockup/dbs'),
    sitemap = require('../../../../lib/sitemap'),
    requiredPaths = ['/page'];

require('should');

describe('models/cms/server', () => {

    before((done) => {
        dbsInit(() => {
            done();
        });
    });
    /* this test require page generators
    it('Works', () => {
        let dustHelpers = 0,
            instance = {
                addDustHelper: () => {
                    dustHelpers++;
                }
            };
        sitemap.flush();
        require('../../')(instance);
        return sitemap.refresh().then((results) => {
            let found = 0;

            results.forEach((result) => {
                if (requiredPaths.indexOf(result.url) !== -1) {
                    found++;
                }
            });
            found.should.be.eql(requiredPaths.length);
            return true;
        });
    });*/

});
