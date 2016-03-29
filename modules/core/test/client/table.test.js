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
    should = require('should'),
    fs = require('fs'),
    XMLHttpRequest = require('../../../../test/mockup/xhr'),
    atomus = require('atomus');

describe('modules/core/client/table', () => {

    let browser, Table, lackey;

    before((callback) => {
        browser = atomus().html(fs.readFileSync(__dirname + '/table.html', 'utf8')).ready(function (errors, window) {
            if (errors) {
                /* istanbul ignore next : i don't want to test this */
                return callback(errors);
            }
            GLOBAL.window = window;
            GLOBAL.document = window.document;
            GLOBAL.XMLHttpRequest = XMLHttpRequest;
            Table = require('../../client/js/table');
            lackey = require('../../client/js');
            callback();
        });
    });

    it('Renders', () => {

        XMLHttpRequest.respond = function (callback) {
            switch (this._uri) {
            case '/api/resource?A=ac&B=%25en%25&C=v%25&D=%25a&limit=10&offset=0':
                this.responseText = JSON.stringify({
                    paging: {},
                    data: [{
                        A: 7,
                        B: 8,
                        C: 9
                }]
                });
                break;
            case '/api/resource?A=ac&B=%25en%25&C=v%25&D=%25a&limit=10&offset=30':
                this.responseText = JSON.stringify({
                    paging: {},
                    data: [{
                        A: 7,
                        B: 8,
                        C: 9
                }]
                });
                break;
            case 'dust/table-body.js':
                this.responseText = fs.readFileSync(__dirname + '/mockups/table.body.txt', 'utf8');
                break;
            case 'dust/table-footer.js':
                this.responseText = fs.readFileSync(__dirname + '/mockups/table.footer.txt', 'utf8');
                break;
            }
            callback();
        };

        let table = Table.init()[0],
            stopPropagation = false,
            preventDefault = false;

        table.filter({
                stopPropagation: () => stopPropagation = true,
                preventDefault: () => preventDefault = true
            },
            lackey.hook('filters'));

        browser.clicked(lackey.hooks('table-paging')[1]);
        stopPropagation.should.be.True;
        preventDefault.should.be.True;
        document.body.innerHTML.should.be.eql(fs.readFileSync(__dirname + '/table.result.html', 'utf8'));
    });


    after(() => {
        GLOBAL.window = null;
        GLOBAL.document = null;
        GLOBAL.XMLHttpRequest = null;
        browser = null;
    });
});
