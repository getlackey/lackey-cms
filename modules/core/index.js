/* eslint no-underscore-dangle:0 */
/* jslint esnext:true, node:true */
/* globals LACKEY_PATH */
'use strict';

const SUtils = require(LACKEY_PATH).utils;

module.exports = (instance) => {
    return SUtils
        .waitForAs(
            'lackey-cms/modules/core',
            require('./server/controllers/errors'),
            require('./server/controllers/activitylog')
        )
        .then((errors, activityLog) => {
            instance.addPostware(errors.on404);
            instance.addMiddleware(activityLog.capture);
            instance.addDustHelper(require('./shared/dust/iterate'));
            instance.addDustHelper(require('./shared/dust/path'));
            instance.addDustHelper(require('./shared/dust/hashmap'));
            instance.addDustHelper(require('./shared/dust/list'));
            instance.addDustHelper(require('./shared/dust/switch'));
            instance.addDustHelper(require('./shared/dust/youtube'));
            instance.addDustHelper(require('./shared/dust/try'));
        });
};
