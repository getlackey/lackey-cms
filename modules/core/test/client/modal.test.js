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
    atomus = require('atomus'),
    MODAL_TEMPLATE = fs.readFileSync(__dirname + '/mockups/modal.txt', 'utf8'),
    CONTENT_TEMPLATE = fs.readFileSync(__dirname + '/mockups/image.txt', 'utf8');

describe('modules/core/client/modal', () => {

    let browser, template, modal;

    before((callback) => {
        browser = atomus().html('<body></body>').ready(function (errors, window) {
            if (errors) {
                /* istanbul ignore next : i don't want to test this */
                return callback(errors);
            }
            GLOBAL.window = window;
            GLOBAL.document = window.document;
            GLOBAL.top = window;
            GLOBAL.XMLHttpRequest = XMLHttpRequest;

            template = require('../../client/js/template');
            modal = require('../../client/js/modal');

            // cache modal template

            /*XMLHttpRequest.respond = function (callback) {
                this.responseText = MODAL_TEMPLATE;
                callback();
            };*/

            callback();

        });
    });

    it('renders', () => {
        let DUMMY = {
            dummy: 1
        };

        XMLHttpRequest.respond = function (callback) {
            this.responseText = CONTENT_TEMPLATE;
            callback();
        };

        return modal.open('cms/cms/image', DUMMY, function (rootNode, vars, resolve, reject) {
            vars.should.be.equal(DUMMY);
            rootNode.innerHTML.should.be.eql('(function (dust) {dust.register("cms\\/cms\\/image", body_0);var blocks = {"body": body_1};function body_0(chk, ctx) {ctx = ctx.shiftBlocks(blocks);return chk.p("cms/core/modal", ctx, ctx, {});}body_0.__dustBody = !0;function body_1(chk, ctx) {ctx = ctx.shiftBlocks(blocks);return chk.w("<ul>").s(ctx.get(["uploaded"], false), ctx, {"block": body_2}, {}).w("</ul><button data-lky-hook="\\&quot;use\\&quot;">apply</button><button data-lky-hook="\\&quot;close\\&quot;">cancel</button>");}body_1.__dustBody = !0;function body_2(chk, ctx) {ctx = ctx.shiftBlocks(blocks);return chk.w("<li><img src="\\&quot;&quot;).f(ctx.getPath(true," []),="" ctx,="" "h").w("\\"=""></li>");}body_2.__dustBody = !0;return body_0}(dust));');
            resolve('yes');
        }).should.finally.be.eql('yes');
    });

    it('handles rejection', () => {
        return modal.open('cms/cms/image', {}, function (rootNode, vars, resolve, reject) {
            reject();
        }).should.be.rejected();
    });

    after(() => {
        GLOBAL.window = null;
        GLOBAL.document = null;
        GLOBAL.XMLHttpRequest = null;
        browser = null;
    })
});
