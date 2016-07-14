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
    base = require('../../../../server/lib/dust/base');

require('should');

describe('models/cms/server/lib/dust/base', () => {

    it('http://google.com/ + /url', () => {
        let dust = {
                filters: {}
            },
            config = {
                get: () => 'http://google.com/'
            };
        base(dust, config);
        dust.filters.base('/url').should.be.eql('http://google.com/url');
    });

    it('http://google.com + /url', () => {
        let dust = {
                filters: {}
            },
            config = {
                get: () => 'http://google.com'
            };
        base(dust, config);
        dust.filters.base('/url').should.be.eql('http://google.com/url');
    });

    it('http://google.com + url', () => {
        let dust = {
                filters: {}
            },
            config = {
                get: () => 'http://google.com'
            };
        base(dust, config);
        dust.filters.base('url').should.be.eql('http://google.com/url');
    });

    it('http://google.com/url + /url', () => {
        let dust = {
                filters: {}
            },
            config = {
                get: () => 'http://google.com/url'
            };
        base(dust, config);
        dust.filters.base('/url').should.be.eql('http://google.com/url/url');
    });

    it('http://google.com/url/ + /url', () => {
        let dust = {
                filters: {}
            },
            config = {
                get: () => 'http://google.com/url/'
            };
        base(dust, config);
        dust.filters.base('/url').should.be.eql('http://google.com/url/url');
    });

    it('http://google.com/url + url', () => {
        let dust = {
                filters: {}
            },
            config = {
                get: () => 'http://google.com/url'
            };
        base(dust, config);
        dust.filters.base('url').should.be.eql('http://google.com/url/url');
    });

    it('http://google.com/url + http://example.com', () => {
        let dust = {
                filters: {}
            },
            config = {
                get: () => 'http://google.com/url'
            };
        base(dust, config);
        dust.filters.base('http://example.com').should.be.eql('http://example.com');
    });

});
