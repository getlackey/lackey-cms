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

const should = require('should'),
    middleware = require('../../../../lib/server/init/falcor');

describe('lib/server/init/falcor', () => {
    it('Works', () => {

        let server = {
                decorateMiddleware: (args, label) => {
                    label.should.be.eql('falcor');
                    args.length.should.be.eql(2);
                    args[0].should.be.eql('/model.json');
                    args[1].should.be.Function;
                }
            },
            route = {
                route: 'pages.byPath[{keys:path}]',
                get: function () {}
            },

            Router = middleware(server)([route]),
            router = new Router(1);

        router.user.should.be.eql(1);
    });
});
