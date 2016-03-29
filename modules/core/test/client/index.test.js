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
    atomus = require('atomus');

let index;

describe('modules/core/client', () => {

    let HTML = '<body>' +
        '<button data-lky-show="#id1" data-lky-hook="show1">show 1</button>' +
        '<button data-lky-hide="#id1" data-lky-hook="hide1">hide 1</button>' +
        '<span id="id1" class="myclass"></span>' +
        '<span data-lky-hook="other"></span>' +
        '<form name="myform">' +
        '<input type="text" name="username" value="billy the kid"/>' +
        '<input type="password" name="password" value="catch me if you can"/>' +
        '<input type="checkbox" name="tnc" checked value="yes"/>' +
        '<input type="checkbox" name="tnc2" value="yes"/>' +
        '<input type="radio" name="options" value="1"/>' +
        '<input type="radio" name="options" value="2" checked/>' +
        '<select name="values"><option>1</option><option selected>A</option></select>' +
        '<textarea name="essay">Lorem ipsum</textarea>' +
        '</form>' +
        '</body>',
        browser;


    before((callback) => {
        browser = atomus().html(HTML).ready(function (errors, window) {
            if (errors) {
                /* istanbul ignore next : i don't want to test this */
                return callback(errors);
            }
            GLOBAL.window = window;
            GLOBAL.document = window.document;
            callback();
        });

    });

    it('inits', () => {
        index = require('../../client/js');
    });

    it('hooks', (callback) => {
        index.hooks('show1').forEach((hook) => {
            browser.clicked(hook);
            let span = document.getElementById('id1');
            span.className.should.be.eql('myclass show');
            callback();
        });
    });

    it('hook', (callback) => {
        let hook = index.hook('show1');
        browser.clicked(hook);
        let span = document.getElementById('id1');
        span.className.should.be.eql('myclass show');
        callback();
    });

    it('hide', (callback) => {

        index.hooks('hide1').forEach((hook) => {
            browser.clicked(hook);
            let span = document.getElementById('id1');
            span.className.should.be.eql('myclass');
        });
        callback();

    });

    it('bind', (callback) => {
        let observed = index.hooks('other')[0];
        index.bind('lky:other', 'click', (event, hook, unbind) => {
            try {
                event.type.should.be.eql('click');
                hook.should.be.equal(observed);
                unbind();
                observed.addEventListener('click', function a() {
                    observed.removeEventListener('click', a);
                    callback(); // memory leak test

                });
                browser.clicked(observed);
            } catch (error) {
                /* istanbul ignore next : i don't want to test this */
                callback(error);
            }
        });
        browser.clicked(observed);
    });

    it('unbind', () => {
        let observed = index.hooks('other')[0],
            count = 0,
            listener = () => count++;

        observed.addEventListener('click', listener);
        browser.clicked(observed);
        browser.clicked(observed);
        index.unbind('lky:other', 'click', listener);
        browser.clicked(observed);
        browser.clicked(observed);
        count.should.be.eql(2);

    });

    it('form', () => {
        index.form(document.forms[0]).should.be.eql({
            username: 'billy the kid',
            password: 'catch me if you can',
            tnc: 'yes',
            tnc2: null,
            options: '2',
            values: 'A',
            essay: 'Lorem ipsum'
        });
    });

    after(() => {
        GLOBAL.window = null;
        GLOBAL.document = null;
        browser = null;
    })
});
