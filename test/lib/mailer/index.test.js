/* jslint node:true, esnext:true, mocha:true */
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
    mailer = require('../../../lib/mailer'),
    SUtils = require('../../../lib/utils'),
    configuration = require('../../../lib/configuration'),
    path = require('path'),
    should = require('should');

describe('lib/mailer/index', () => {
    before(() => {
        configuration.unload();
        SUtils.setProjectPath(path.join(__dirname, '/../../../test/mockup/project/'));
        return configuration('test', {
            mailer: {
                type: __dirname + '/../../../test/mockup/mailtransport'
            }
        });
    });
    it('Works', () => {
        return mailer({
                from: 'test@example.com',
                to: 'test@example.com',
                template: 'cms/users/emails/confirm-email',
                subject: 'Hello world',
                html: '<h1>Hello world</h1>',
                text: 'Hello World'
            })
            .then(c => console.log(c));
    });
    after(() => {
        configuration.unload();
    });
});
