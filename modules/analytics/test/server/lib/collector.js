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
    dbsInit = require('../../../../../test/mockup/dbs'),
    collector = require('../../../server/lib/collector');
require('should');

describe('modules/analytics/server/lib/collector', () => {

    let AnalyticsModel,
        metricA = 'metric:a',
        metricB = 'metric:b';

    before((done) => {
        dbsInit(() => {
            require('../../../../core/server/models/analytics')
                .then((model) => {
                    AnalyticsModel = model;
                    return AnalyticsModel.removeAll();
                })
                .then(() => {
                    done();
                }, (error) => {
                    /* istanbul ignore next : i don't want to test this */
                    done(error);
                });
        });
    });


    it('logs', () => {
        return collector
            .log(metricA)
            .then(() => AnalyticsModel.count())
            .then(count => {
                count.should.be.eql(1);
                return collector
                    .log(metricA);
            })
            .then(() => AnalyticsModel.count())
            .then(count => {
                count.should.be.eql(1);
                return collector
                    .log(metricB);
            })
            .then(() => AnalyticsModel.count())
            .then(count => {
                count.should.be.eql(2);
                return AnalyticsModel.findOneBy('metric', metricB);
            })
            .then(metric => {
                metric.value.should.be.eql(1);
                return AnalyticsModel.findOneBy('metric', metricA);
            })
            .then(metric => {
                metric.value.should.be.eql(2);
                return collector
                    .log(metricB, 5);
            })
            .then(() => AnalyticsModel.count())
            .then(count => {
                count.should.be.eql(2);
                return AnalyticsModel.findOneBy('metric', metricB);
            })
            .then(metric => {
                metric.value.should.be.eql(6);
                return true;
            })
            .should.finally.be.eql(true);
    });

});
