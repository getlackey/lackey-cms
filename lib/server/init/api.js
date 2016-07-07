/*jslint node:true, nomen:true, unparam:true, esnext:true */
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


const _ = require('lodash');

function serialize(data) {
    if (Array.isArray(data)) {
        return data.map(serialize);
    } else if (_.isObject(data) && data.toJSON) {
        return data.toJSON();
    } else {
        return data;
    }
}

module.exports = function (server) {
    server.use((req, res, next) => {
        res.api = (result) => {
            let data = serialize(result);
            res.header('Content-Type', 'application/json');
            res.send(data, 'json');
        };
        res.yaml = (result) => {
            res.header('Content-Type', 'text/x-yaml');
            var data = serialize(result, true);
            res.send(data, 'yaml');
        };
        next();
    });

};
