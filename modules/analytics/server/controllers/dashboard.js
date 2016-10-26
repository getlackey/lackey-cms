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
const ModuleLoader = require(LACKEY_PATH).loader;

/**
 * @class
 */
class AnalititcsDashboardController {

    static get metrics() {
        return ModuleLoader
            .list()
            .map(moduleName => ModuleLoader.get(moduleName).Analytics)
            .filter(analytics => !!analytics)
            .reduce((previous, current) => previous.concat(current), []);
    }

    /**
     * Renders table view
     * @param {AnalyticsModel} model
     * @param {Request}   req
     * @param {Resposne} res
     */
    static table(model, req, res) {

        let metric = this.metrics[req.metricIndex];

        model
            .leaderboard(metric.sqlMatch, metric.regex, metric.map)
            .then(table => {
                if (req.__resFormat === 'xlsx') {
                    return res.send({
                        table: {
                            cols: table.columns.map(column => {
                                return {
                                    caption: column.label,
                                    beforeCellWrite: (row, cellData) => {
                                        return column.date ? cellData.date : cellData;
                                    }
                                };
                            }),
                            rows: table.rows.map(row => row.columns.map(column => column.value !== undefined ? column.value : ''))
                        }
                    });
                }
                res.js([
                        'js/cms/cms/table.js',
                        'js/cms/analytics/charts.js'
                    ]);
                res.css([
                        'css/cms/cms/table.css',
                        'css/cms/analytics/charts.css'
                    ]);
                res.print('cms/analytics/tableview', {
                    metric: metric,
                    table: table
                });
            }, err => console.log(err) && res.error(err));


    }

    static index(req, res) {
        res.js([
                'js/cms/analytics/charts.js'
            ]);
        res.css([
                'css/cms/analytics/charts.css'
            ]);
        res.print('cms/analytics/dashboard', {
                metrics: this.metrics
        });
    }
}

module.exports = AnalititcsDashboardController;
