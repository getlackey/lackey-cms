/* jslint node:true, esnext:true */
'use strict';

const regex = new RegExp('(https?://)?(www\\.)?(yotu\\.be/|youtube\\.com/)?((.+/)?(watch(\\?v=|.+&v=))?(v=)?)([\\w_-]{11})(&.+)?');

module.exports = (url) => {
    if(!url) {
        return null;
    }
    var match = url.match(regex);
    if(match && url.match(new RegExp('(yotu\\.be/|youtube\\.com/)'))) {
        return match[9];
    }
    return null;
};

