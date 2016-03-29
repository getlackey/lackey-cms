/* jslint esnext:true, node:true */
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
if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../lib';
}

module.exports = require('../models/language')
    .then((Model) => {
        return {

            // ================================================ CRUD

            // Create
            // Read
            read: (req, res) => {
                res.api(req.language);
            },
            // Update
            // Delete
            // List
            list: (req, res) => {
                let rest = req.getRESTQuery();
                Model.queryWithCount(rest.query, rest.populate, rest.options).then((table) => {
                    res.api(table);
                });
            },
            // ById
            byId: (req, res, next, id) => {
                Model.findById(id).then((language) => {
                    req.language = language;
                    next();
                }, (error) => {
                    req.error(error);
                });
            }
        };
    });
// ================================================ /CRU
