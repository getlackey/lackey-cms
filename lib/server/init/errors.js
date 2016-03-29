/*jslint node:true, nomen:true, unparam:true, esnext:true */
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


const errors = require('common-errors'),
    SCli = require('../../utils/cli');

module.exports = (server) => {

    SCli.debug('lackey-cms/server/init/errors', 'Setting up');

    // If we got to this point there was no handler for this request
    server.use(module.exports.notFound);

    // Just in Case... Catch all!
    server.use(errors.middleware.crashProtector());
};
/* istanbul ignore next : external */
module.exports.notFound = function (req, res, next) {
    next(new errors.NotFoundError(req.originalUrl));
};
