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
require('should');

let controller;

describe('modules/core/server/controllers/activitylog', () => {

    before((done) => {
        require('../../../../../test/mockup/dbs')(() => {
            require('../../../server/controllers/activitylog').then((ctrl) => {
                controller = ctrl;
                done();
            });
        });
    });

    it('captureRequst GET', (callback) => {
        controller.captureRequest({
            method: 'GET'
        }, {}, callback);
    });

    it('captureRequst POST - no user', (callback) => {
        controller.captureRequest({
            method: 'POST'
        }, {}, callback);
    });

    it('captureRequst POST - with user', (callback) => {

        let res = {
            end: () => {
                callback();
            }
        };

        controller.captureRequest({
            method: 'POST',
            user: {
                _doc: {
                    id: 0
                }
            }
        }, res, () => {
            res.end('chunk', 'utf8');
        });
    });

    it('captureRequst POST - with erroring user', (callback) => {

        let res = {
            end: () => {
                callback();
            }
        };

        controller.captureRequest({
            method: 'POST',
            user: {}
        }, res, () => {
            res.end('chunk', 'utf8');
        });
    });

    it('captureRequst POST - with erroring end', (callback) => {

        let res = {
            end: () => {
                res.end = () => {
                    callback();
                };
                throw new Error('Nothing wrong');
            }
        };

        controller.captureRequest({
            method: 'POST',
            user: {}
        }, res, () => {
            res.end('chunk', 'utf8');
        });
    });

    it('adds middleware', (callback) => {
        controller.capture({
            decorateMiddleware: (argsList, name) => {
                argsList.should.be.Array;
                argsList.length.should.be.eql(1);
                name.should.be.String;
                callback();
            }
        });
    });

});
