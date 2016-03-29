/*jslint node:true, nomen:true, unparam:true */
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

module.exports = function (server) {
    server.crud = function (path, name, middleware, endpoints) {
        var
            param = name + '_id',
            singlePath = path + '/:' + param,
            route = server.route(path),
            singleRoute = server.route(singlePath);

        if (middleware) {
            route = route.all(middleware);
            singleRoute = singleRoute.all(middleware);
        }

        if (endpoints.create) {
            route.post(endpoints.create);
        }
        if (endpoints.read) {
            singleRoute.get(endpoints.read);
        }
        if (endpoints.update) {
            singleRoute.put(endpoints.update);
        }
        if (endpoints.delete) {
            singleRoute.delete(endpoints.delete);
        }
        if (endpoints.list) {
            route.get(endpoints.list);
        }

        if (endpoints.byID) {
            server.param(param, endpoints.byID);
        } else {
            server.param(param, function (req, res, next, id) {
                req[param] = id;
                next();
            });
        }
    };
};
