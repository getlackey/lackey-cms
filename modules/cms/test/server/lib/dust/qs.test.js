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
    base = require('../../../../server/lib/dust/qs');

require('should');

describe('models/cms/server/lib/dust/qs', () => {

    it('?test=test2&testing=55 - no except', () => {
        let dust = {
                filters: {},
                helpers: {}
            },
            chunk = {},
            context = {
                get: () => {
                    return {
                        test: 'test2',
                        testing: 55
                    };
                }
            },
            bodies = {},
            params = {};

        base(dust);
        dust.helpers.qs(chunk, context, bodies, params).should.be.eql('?test=test2&testing=55');
    });

    it('?test=test2&testing=55 - except', () => {
        let dust = {
                filters: {},
                helpers: {}
            },
            chunk = {},
            context = {
                get: () => {
                    return {
                        test: 'test2',
                        testing: 55
                    };
                }
            },
            bodies = {},
            params = {
                except: 'test'
            };

        base(dust);
        dust.helpers.qs(chunk, context, bodies, params).should.be.eql('?testing=55');
    });

});
