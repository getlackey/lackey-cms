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
    XMLHttpRequest = require('../../../../test/mockup/xhr'),
    atomus = require('atomus');

describe('modules/core/client/template', () => {

    let browser, template;

    before((callback) => {
        browser = atomus().html('<body></body>').ready(function (errors, window) {
            if (errors) {
                /* istanbul ignore next : i don't want to test this */
                return callback(errors);
            }
            GLOBAL.window = window;
            GLOBAL.document = window.document;
            GLOBAL.XMLHttpRequest = XMLHttpRequest;
            template = require('../../client/js/template');
            callback();
        });
    });

    it('renders', () => {

        XMLHttpRequest.respond = function (callback) {
            this.responseText = '(function(dust){dust.register("default/template",body_0);function body_0(chk,ctx){return chk.w("<div>").f(ctx.get(["data"], false),ctx,"h").w("</div>");}body_0.__dustBody=!0;return body_0}(dust));';
            callback();
        };

        return template.render('default/template', {
            data: 'Lorem ipsum'
        }).then((templates) => {
            var div = document.createElement('div');
            templates.forEach((template) => {
                div.appendChild(template);
            });
            div.innerHTML.should.be.eql('<div>Lorem ipsum</div>');
        });
    });

    it('renders from cache', () => {

        let inc = 0;

        XMLHttpRequest.respond = /* istanbul ignore next : i don't want to test this */ function (callback) {
            inc++;
            callback();
        };

        return template.render('default/template', {
            data: 'Lorem ipsum'
        }).then((templates) => {
            var div = document.createElement('div');
            templates.forEach((template) => {
                div.appendChild(template);
            });
            div.innerHTML.should.be.eql('<div>Lorem ipsum</div>');
            inc.should.be.eql(0);
        });
    });

    it('renders - return root element', () => {

        return template.render('default/template', {
            data: 'Lorem ipsum'
        }, {
            returnRoot: true
        }).then((template) => {
            template.innerHTML.should.be.eql('<div>Lorem ipsum</div>');
        });
    });

    it('redraws', () => {

        XMLHttpRequest.respond = function (callback) {
            this.responseText = require('fs').readFileSync(__dirname + '/mockups/abc.txt', 'utf8');
            callback();
        };

        return template.render('abc', {}, {
            returnRoot: true
        }).then((root) => {
            return template.redraw('preview', {}, root);
        }).then((a) => {
            return true;
        }).should.finally.be.eql(true);

    });

    describe('handle errors', () => {


        it('404', () => {
            XMLHttpRequest.respond = function (callback) {
                callback();
            };
            template.render('anyother').should.be.rejected();
        });

        it('Error in template', () => {
            XMLHttpRequest.respond = function (callback) {
                this.responseText = '<html></html>';
                callback();
            };

            return template.render('default/abc').should.be.rejected();
        });

    });


    after(() => {
        GLOBAL.window = null;
        GLOBAL.document = null;
        GLOBAL.XMLHttpRequest = null;
        browser = null;
    })
});
