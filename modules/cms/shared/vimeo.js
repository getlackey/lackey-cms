/* jslint node:true, esnext:true */
'use strict';

const regex = /^https:\/\/(player\.|)vimeo\.com(\/video|)\/(\d+)/;

module.exports = (url) => {
    if (!url) {
        return null;
    }
    var match = url.match(regex);
    if (match && match[3]) {
        return match[3];
    }
    return null;
};
