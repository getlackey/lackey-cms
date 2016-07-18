/* jslint node:true, esnext:true */
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

module.exports = Promise.resolve({
    on404: (req, res) => {
        console.log('error ', req.path, req.route);
        res.status(404);
        res.print(['~/core/404', 'cms/core/404'], {
            path: req.path
        });

    },
    on403: (req, res) => {

        res.status(403);
        res.print(['~/core/403', 'cms/core/403'], {
            path: req.path
        });

    },
    on500: (req, res) => {

        res.status(500);
        res.print(['~/core/500', 'cms/core/500'], {
            path: req.path
        });

    }
});
