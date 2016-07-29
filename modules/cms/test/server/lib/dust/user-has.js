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

const userHas = require('../../../../server/lib/dust/user-has');

require('should');

let dust = {
        helpers: {}
    },
    chunk = {
        value: true,
        render: (blockName) => {
            return blockName;
        }
    },
    bodies = {
        test: 'test',
        test2: 'test2',
        block: 'block'
    },
    context = [];

describe('models/cms/server/lib/dust/user-has', () => {

    it('Test 1', () => {
        let params = {
            type: 'roles',
            user: {
                roles: [{
                        name: 'test'
                }]
            }
        };

        userHas(dust);
        dust.helpers.userHas(chunk, context, bodies, params).should.be.eql(bodies.test);
    });

    it('Test 2', () => {
        let params = {
            type: 'roles',
            user: {
                roles: [{
                    name: 'test2'
                }]
            }
        };

        userHas(dust);
        dust.helpers.userHas(chunk, context, bodies, params).should.be.eql(bodies.test2);
    });

    it('Test None', () => {
        let params = {
            type: 'roles',
            user: {
                roles: []
            }
        };

        userHas(dust);
        dust.helpers.userHas(chunk, context, bodies, params).should.be.eql(bodies.block);
    });

    it('Test No User', () => {
        let params = {
            type: 'roles'
        };

        userHas(dust);
        dust.helpers.userHas(chunk, context, bodies, params).should.be.eql(chunk);
    });
});
