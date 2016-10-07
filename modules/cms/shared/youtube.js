/* jslint node:true */
'use strict';

var regex = new RegExp('(https?://)?(www\\.)?(youtu\\.be/|youtube\\.com/)?((.+/)?(watch(\\?v=|.+&v=))?(v=)?)([\\w_-]{11})(&.+)?'),
    qs = require('querystring');

module.exports = function (url, withList) {
    if (!url) {
        return null;
    }
    var match = url.match(regex);
    if (match && url.match(new RegExp('(youtu\\.be/|youtube\\.com/)'))) {
        if (withList) {
            var args = qs.parse(url.replace(/^.+\?/, ''));
            if (args.list) {
                return match[9] + '?list=' + args.list;
            }
        }
        return match[9];
    }
    return null;
};
