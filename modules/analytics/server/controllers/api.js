/* jslint esnext:true, node:true */
/* global LACKEY_PATH */
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
    filter = require('../lib/dust/filter');

module.exports = SUtils
    .waitForAs('analytics',
        SUtils.cmsMod('analytics').path('server/lib/collector'),
        require(LACKEY_PATH).configuration()
    )
    .then((collector, configuration) => {
        return Promise.resolve({
            log: (req, res) => {
                if (req.metric === 'redirect') {
                    let value = filter.decode(req.metricValue, configuration.get('host'));
                    collector.log('redirect:' + value, 1);
                    res.redirect(value);
                } else {
                    collector.log(req.metric, req.metricValue);
                    res.status(204).send('OK', 'json');
                }

            }
        });
    });
