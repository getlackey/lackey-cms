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
let controller;

require('should');

describe('modules/core/server/controllers/errors', () => {

    before(() => {
        return require('../../../server/controllers/errors')
            .then((ctrl) => {
                controller = ctrl;
            });
    });

    it('Works', (callback) => {
        let res = {
            status: (status) => {
                res.status = status;
            },
            print: (content) => {
                try {
                    res.status.should.be.eql(404);
                    content.should.be.eql(['~/core/404', 'cms/core/404'], {
                        path: 'abc'
                    });
                    callback();
                } catch (error) {
                    /* istanbul ignore next : i don't want to test this */
                    callback(error);
                }
            }
        };
        controller.on404({
            path: 'abc'
        }, res);
    });

});
