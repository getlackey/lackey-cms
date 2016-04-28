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
    dbsInit = require('../../../../test/mockup/dbs');
require('should');

describe('modules/core/server/setup', () => {
    before((done) => {
        dbsInit(() => {
            done();
        });
    });

    it('Works', () => {

        let middlewares = 0,
            postware = 0,
            dust = 0,
            server = {
                addPostware: () => {
                    postware++;
                },
                addMiddleware: () => {
                    middlewares++;
                },
                addDustHelper: () => {
                    dust++;
                }
            };
        return require('../..')(server)
            .then(() => {
                middlewares.should.be.eql(1, 'middleware');
                postware.should.be.eql(1, 'postware');
                dust.should.be.eql(4, 'dust');
                server.instance = null;
                return true;
            }).should.finally.be.eql(true);
    });


});
