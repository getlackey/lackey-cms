'use strict';

var yt_regex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;

function youtube_parser(url) {
    var match = url.match(yt_regex);
    return match && match[7].length === 11 ? match[7] : url;
}

/*eslint-disable max-len */
var vimeo_regex = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
/*eslint-enable max-len */
function vimeo_parser(url) {
    var match = url.match(vimeo_regex);
    return match && typeof match[3] === 'string' ? match[3] : url;
}

var EMBED_REGEX = /@\[([a-zA-Z].+)\]\([\s]*(.*?)[\s]*[\)]/im;

function video_embed(md, options) {
    function video_return(state, silent) {
        var serviceEnd,
            serviceStart,
            token,
            oldPos = state.pos;

        if (state.src.charCodeAt(oldPos) !== 0x40 /* @ */ ||
            state.src.charCodeAt(oldPos + 1) !== 0x5B /* [ */ ) {
            return false;
        }

        var match = EMBED_REGEX.exec(state.src);

        if (!match || match.length < 3) {
            return false;
        }

        var service = match[1];
        var videoID = match[2];
        var src = match[2];
        var serviceLower = service.toLowerCase();

        if (serviceLower === 'youtube') {
            videoID = youtube_parser(videoID);
        } else if (serviceLower === 'vimeo') {
            videoID = vimeo_parser(videoID);
        } else if (!options[serviceLower]) {
            return false;
        }

        // If the videoID field is empty, regex currently make it the close parenthesis.
        if (videoID === ')') {
            videoID = '';
        }

        serviceStart = oldPos + 2;
        serviceEnd = md.helpers.parseLinkLabel(state, oldPos + 1, false);

        //
        // We found the end of the link, and know for a fact it's a valid link;
        // so all that's left to do is to call tokenizer.
        //
        if (!silent) {
            state.pos = serviceStart;
            state.posMax = serviceEnd;
            state.service = state.src.slice(serviceStart, serviceEnd);
            var newState = new state.md.inline.State(service, state.md, state.env, []);
            newState.md.inline.tokenize(newState);

            token = state.push('video', '');
            token.videoID = videoID;
            token.service = service;
            token.src = src;
            token.level = state.level;
        }

        state.pos = state.pos + state.src.indexOf(')', state.pos);
        state.posMax = state.tokens.length;
        return true;
    }

    return video_return;
}

function video_url(service, videoID) {
    switch (service) {
    case 'youtube':
        return 'https://img.youtube.com/vi/' + videoID + '/maxresdefault.jpg';
    case 'vimeo':
        return 'https://i.vimeocdn.com/video/' + videoID + '_600x400.jpg';
    }
}

function tokenize_video(md) {
    function tokenize_return(tokens, idx) {
        var videoID = md.utils.escapeHtml(tokens[idx].videoID);
        var service = md.utils.escapeHtml(tokens[idx].service).toLowerCase();
        return videoID === '' ? '' :
            '<img markdown-type=' + service + '" ' +
            'markdown-src="' + md.utils.escapeHtml(tokens[idx].src) + '" ' +
            'src="' + video_url(service, videoID) +
            '">';
    }

    return tokenize_return;
}

module.exports = function imagizer(md, options) {

    md.renderer.rules.video = tokenize_video(md, options);
    md.inline.ruler.before('emphasis', 'video', video_embed(md, options));
}
