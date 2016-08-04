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


describe('modules/core/server/models/analytics', () => {

    let Analytics,
        metricA = 'metric:a',
        metricB = 'metric:b';

    before((done) => {
        dbsInit(() => {
            require('../../../server/models/analytics').
            then((model) => {
                Analytics = model;
                return Analytics.removeAll();
            }).then(() => {
                done();
            }, (error) => {
                /* istanbul ignore next : i don't want to test this */
                done(error);
            });
        });
    });


    it('logs', () => {
        return Analytics
            .inc(metricA)
            .then(() => Analytics.count())
            .then(count => {
                count.should.be.eql(1);
                return Analytics
                    .inc(metricA);
            })
            .then(() => Analytics.count())
            .then(count => {
                count.should.be.eql(1);
                return Analytics
                    .inc(metricB);
            })
            .then(() => Analytics.count())
            .then(count => {
                count.should.be.eql(2);
                return Analytics.findOneBy('metric', metricB);
            })
            .then(metric => {
                metric.value.should.be.eql(1);
                return Analytics.findOneBy('metric', metricA);
            })
            .then(metric => {
                metric.value.should.be.eql(2);
                return Analytics
                    .inc(metricB, 5);
            })
            .then(() => Analytics.count())
            .then(count => {
                count.should.be.eql(2);
                return Analytics.findOneBy('metric', metricB);
            })
            .then(metric => {
                metric.value.should.be.eql(6);
                return true;
            })
            .should.finally.be.eql(true);
    });

});
