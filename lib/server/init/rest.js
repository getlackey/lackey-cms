/*jslint node:true, unparam:true, regexp:true, esnext:true  */
'use strict';

/*
    Copyright 2015 Enigma Marketing Services Limited

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
    SCli = require('../../utils/cli'),
    reserved = ['sort', 'limit', 'offset', 'fields', 'q', 'format', 'raw', 'page', 'jsonpath'],
    _ = require('lodash');

module.exports = (server) => {

    SCli.debug('lackey-cms/server/init/rest', 'Setting up');
    server.decorateMiddleware([module.exports.rest], 'rest');
};

module.exports.defaultLocale = 'en';

module.exports.rest = (req, res, next) => {

    req.getRESTQuery = (truncate) => {

        let result = {
            query: {},
            populate: null,
            options: {}
        };

        if (req.query.sort) {
            result.options.sort = {};
            req.query.sort.split(',').forEach((ruleName) => {
                let dir = 1,
                    rule = ruleName;
                if (rule[0] === '-') {
                    dir = -1;
                    rule = rule.substr(1);
                }
                result.options.sort[rule] = dir;
            });
        }

        if (req.query.q) {
            result.options.textSearch = req.query.q;
        }

        if (['table'].indexOf(req.query.format) !== '-1') {
            result.options.format = req.query.format;
        }

        if (req.query.raw) {
            result.options.raw = true;
        }

        Object.keys(req.query).forEach((key) => {
            if (reserved.indexOf(key) === -1) {
                if (!truncate || req.query[key].length) {
                    result.query[key] = req.query[key];
                    if (typeof result.query[key] === 'string' && result.query[key].indexOf('%') !== -1) {
                        result.query[key] = {
                            operator: 'like',
                            value: result.query[key]
                        };
                    }
                }
            }
        });

        if (req.query.fields) {
            result.populate = {};
            req.query.fields.split(',').forEach((keyName) => {
                let dir = 1,
                    key = keyName;
                if (key[0] === '-') {
                    dir = -1;
                    key = key.substr(1);
                }
                result.populate[key] = dir;
            });
        }

        if (req.query.limit) {
            result.options.limit = +req.query.limit;
            if (req.query.page) {
                result.options.offset = result.options.limit * (req.query.page - 1);
            }
        }

        if (req.query.offset) {
            result.options.offset = +req.query.offset;
        }

        if(req.query.page) {
            result.options.page = +req.query.page;
        }

        return result;

    };

    res.table = (table) => {
        res.api({
            paging: _.merge(table.paging, {
                current: 'todo',
                next: 'todo',
                previous: 'todo'
            }),
            data: table.rows.map((row) => {
                return row.columns;
            })
        });
    };

    next();

};
