/* eslint no-underscore-dangle:0 */
/* jslint node:true, esnext:true */
/* globals LACKEY_PATH */
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
    SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    Model = objection.Model,
    SCli = require(LACKEY_PATH).cli,
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/analytics',
    KNEX = require('../knex');

SCli.debug(__MODULE_NAME, 'REQUIRED');

module.exports = SUtils
    .waitForAs(
        __MODULE_NAME,
        SUtils.cmsMod('core').model('objection'),
        KNEX
    )
    .then((ObjectionWrapper) => {
        SCli.debug(__MODULE_NAME, 'READY');

        class AnalyticsModel extends Model {
            static get tableName() {
                return 'analytics';
            }
        }

        class Analytics extends ObjectionWrapper {

            static get api() {
                return '/cms/analytics';
            }

            get metric() {
                return this._doc.metric;
            }

            get date() {
                return this._doc.date;
            }

            get value() {
                return this._doc.value;
            }

            static get model() {
                return AnalyticsModel;
            }

            static distinctMetricsCount() {
                return SCli
                    .sql(AnalyticsModel
                        .knex()
                        .raw('select count(*) from (select distinct "metric" from "analytics") as foo'))
                    .then(r => +r.rows[0].count);
            }

            static map(list, ruleSet, regex) {
                return Promise.all(list.map(item => {
                    console.log('item', item);
                    let json = item.toJSON();
                    if (!json) return json;
                    console.log('json', json);
                    return Promise
                        .all(ruleSet.map(rule => {
                            console.log(json, json.metric.replace(regex, rule.value));
                            return SUtils
                                .cmsMod('core') // TODO: support other modules
                                .model(rule.model)
                                .then(model => model.findById(json.metric.replace(regex, rule.value)))
                                .then(object => {
                                    console.log('obj', object);
                                    if (object) {
                                        json.view = object;
                                    }
                                });
                        }))
                        .then(a => console.log('a', a) && json)
                        .catch(err => console.log('err', err));
                }));
            }

            static leaderboard(pattern, regPattern, map) {

                let regex = new RegExp(regPattern);

                return this
                    .distinctMetricsCount(pattern)
                    .then(() => {
                        return SCli
                            .sql(AnalyticsModel
                                .query()
                                .select(AnalyticsModel.raw('SUM(value) as value'), 'metric')
                                .where('metric', 'like', pattern)
                                .groupBy('metric')
                                .orderBy('value', 'desc')
                            );
                    })
                    .then(list => map ? Analytics.map(list, map, regex) : list)
                    .then(list => {
                        console.log('list', list);
                        return {
                            actions: [],
                            columns: [{
                                label: 'Metric',
                                name: 'metric'
                        }, {
                                label: 'Value',
                                name: 'vallue'
                        }],
                            rows: list.map(row => {
                                return {
                                    columns: [{
                                        value: row.metric.match(regex)[1]
                                }, {
                                        value: row.value
                                }]
                                };
                            })
                        };
                    });
            }

            static inc(metric, value) {
                let date = new Date();
                return SCli
                    .sql(AnalyticsModel.raw('INSERT INTO "analytics" AS a ("metric","date", "value") VALUES (?, ?::date, ?) ON CONFLICT ON CONSTRAINT "analytics_metric_date_unique" DO UPDATE SET "value" = a."value" + ? ', [metric, date, value || 1, value || 1]))
                    .then(r => r); // because knex is stupid
            }

            toJSON() {
                return {
                    id: this._doc.id,
                    metric: this._doc.metric,
                    date: this._doc.date,
                    value: this._doc.value
                };
            }


        }

        return Analytics;
    });
