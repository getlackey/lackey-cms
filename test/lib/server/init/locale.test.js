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
    locale = require('../../../../lib/server/init/locale'),
    translate = locale.translate;

describe('lib/server/init/locale', () => {

    it('Setups', () => {

        let server = {
            _middleware: [],
            decorateMiddleware: (args) => {
                server._middleware.push(args[0]);
            }
        };

        locale(server);

        server._middleware.should.be.eql([translate]);

    });

    let tests = {
        '/': {
            route: '/',
            locale: 'en'
        },
        '/about': {
            route: '/about',
            locale: 'en'
        },
        '/fr': {
            route: '/',
            locale: 'fr'
        },
        '/de-CH/eine/kleine/Schmetterling': {
            route: '/eine/kleine/schmetterling',
            locale: 'de-CH'
        },
        '/chrząszcz/brzmi/w/trzcinie/w/Szczebrzeszynie/ze/Świerszczami': {
            route: '/chrząszcz/brzmi/w/trzcinie/w/szczebrzeszynie/ze/świerszczami',
            locale: 'en'
        },
        '/ast/about': {
            route: '/about',
            locale: 'ast'
        },
        '/zh-Hans/about': {
            route: '/about',
            locale: 'zh-Hans'
        },
        '/zh-Hant-TW/about': {
            route: '/about',
            locale: 'zh-Hant-TW'
        },
        '/de-CH-1901/about': {
            route: '/about',
            locale: 'de-CH-1901'
        }
    };



    Object.keys(tests).forEach((test) => {

        it(test + ' => ' + JSON.stringify(tests[test]), (next) => {

            let req = {
                    path: test
                },
                res = {};
            translate(req, res, (error) => {
                should.not.exist(error);
                Object.keys(tests[test]).forEach((key) => {
                    should.exist(req[key], '`' + key + '` should be set');
                    req[key].should.be.eql(tests[test][key]);
                });
                next();
            });
        });

    });

    it('Redundant', (cb) => {

        translate({
            path: '/zh-yue/about'
        }, {
            redirect: (path) => {
                path.should.be.eql('/yue/about');
                cb();
            }
        });

    });


});
