/* jslint node:true */
'use strict';
module.exports = function (basePath, origPathName, givePrefix) {
    var
        pathPrefix = basePath.replace(/.+?:\/\/.+?\/(.*)$/, '$1'),
        cleanPrefix = (pathPrefix && pathPrefix.length) ? (pathPrefix.replace(/([^\/]{1})\/$/, '$1')) : pathPrefix,
        pathName = origPathName.replace(/([^\/]{1})\/$/, '$1'),
        pathNameWithNoPrefix = (cleanPrefix && cleanPrefix.length) ? pathName.replace(new RegExp('^\/' + cleanPrefix), '') : pathName,
        adminPath = basePath.replace(/\/$/, '') + '/admin' + pathNameWithNoPrefix;

    if (givePrefix) {
        return cleanPrefix;
    }

    return adminPath;
};
