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
    dbsInit = require('../../../../../test/mockup/dbs');


describe('modules/core/server/models/activitylog', () => {

    let ActivityLog;

    before((done) => {
        dbsInit(() => {
            require('../../../server/models/activity-log').
            then((model) => {
                ActivityLog = model;
                return ActivityLog.removeAll();
            }).then(() => {
                done();
            }, (error) => {
                /* istanbul ignore next : i don't want to test this */
                done(error);
            });
        });
    });


    it('logs', () => {
        return ActivityLog.log({
            method: 'POST',
            url: '/echo',
            headers: {
                'a': 'b'
            },
            body: {'abc':1},
            status: 200,
            response: 'DEF',
            duration: 10000

        }).then((res) => {
            return ActivityLog.findById(res.id);
        }).then((result) => {
            should.exist(result);
            result.method.should.eql('POST');
            result.url.should.eql('/echo');
            result.headers.should.eql({
                a: 'b'
            });
            result.body.should.be.eql({'abc':1});
            result.status.should.eql(200);
            result.response.should.eql({raw:'DEF'});
            result.duration.should.eql(10000);
        });
    });

});
