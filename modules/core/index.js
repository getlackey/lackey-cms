/* eslint no-underscore-dangle:0 */
/* jslint esnext:true, node:true */
'use strict';

const SUtils = require(LACKEY_PATH).utils;

module.exports = (instance) => {
    return SUtils.deps(
            require('./server/controllers/errors'),
            require('./server/controllers/activitylog')
        )
        .promised((errors, activityLog) => {
            instance.addPostware(errors.on404);
            instance.addMiddleware(activityLog.capture);
            instance.addDustHelper(require('./shared/dust/iterate'));
            instance.addDustHelper(require('./shared/dust/path'));
            instance.addDustHelper(require('./shared/dust/hashmap'));
            instance.addDustHelper(require('./shared/dust/list'));
        });
};
