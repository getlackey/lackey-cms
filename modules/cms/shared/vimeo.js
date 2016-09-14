/* jslint node:true */
'use strict';

var regex = /^https:\/\/(player\.|)vimeo\.com(\/video|)\/(\d+)/;

module.exports = function (url) {
    if (!url) {
        return null;
    }
    var match = url.match(regex);
    if (match && match[3]) {
        return match[3];
    }
    return null;
};
