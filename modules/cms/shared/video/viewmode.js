/* eslint space-in-parens:0, default-case:0, no-param-reassign:0 */
//https://raw.githubusercontent.com/brianjgeiger/markdown-it-video/master/index.js
// Process @[youtube](youtubeVideoID)
// Process @[vimeo](vimeoVideoID)
// Process @[vine](vineVideoID)
// Process @[prezi](preziID)


'use strict';

const
  qs = require('querystring');

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

var vine_regex = /^http(?:s?):\/\/(?:www\.)?vine\.co\/v\/([a-zA-Z0-9]{1,13}).*/;

function vine_parser(url) {
  var match = url.match(vine_regex);
  return match && match[1].length === 11 ? match[1] : url;
}

var prezi_regex = /^https:\/\/prezi.com\/(.[^/]+)/;

function prezi_parser(url) {
  var match = url.match(prezi_regex);
  return match ? match[1] : url;
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
    var list = null;
    var serviceLower = service.toLowerCase();

    if (serviceLower === 'youtube') {
      videoID = youtube_parser(videoID);

      let q = qs.parse(match[2].split('?')[1]);

      if (q.list) {
        list = q.list;
      }
    } else if (serviceLower === 'vimeo') {
      videoID = vimeo_parser(videoID);
    } else if (serviceLower === 'vine') {
      videoID = vine_parser(videoID);
    } else if (serviceLower === 'prezi') {
      videoID = prezi_parser(videoID);
    } else if (serviceLower === 'htmlvideo') {
      videoID = videoID;
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
      newState.list = list;
      newState.md.inline.tokenize(newState);

      token = state.push('video', '');
      token.videoID = videoID;
      token.service = service;
      token.level = state.level;
      token.list = list;
    }

    state.pos = state.pos + state.src.indexOf(')', state.pos);
    state.posMax = state.tokens.length;

    return true;
  }

  return video_return;
}

function video_url(service, videoID, options) {

  switch (service) {
  case 'youtube':
    if (options.list) {
      return '//www.youtube.com/embed/' + videoID + '?list=' + options.list;
    }
    return '//www.youtube.com/embed/' + videoID;
  case 'vimeo':
    return '//player.vimeo.com/video/' + videoID;
  case 'vine':
    return '//vine.co/v/' + videoID + '/embed/' + options.vine.embed;
  case 'htmlvideo':
    return videoID;
  case 'prezi':
    return 'https://prezi.com/embed/' + videoID +
      '/?bgcolor=ffffff&amp;lock_to_path=0&amp;autoplay=0&amp;autohide_ctrls=0&amp;' +
      'landing_data=bHVZZmNaNDBIWnNjdEVENDRhZDFNZGNIUE43MHdLNWpsdFJLb2ZHanI5N1lQVHkxSHFxazZ0UUNCRHloSXZROHh3PT0&amp;' +
      'landing_sign=1kD6c0N6aYpMUS0wxnQjxzSqZlEB8qNFdxtdjYhwSuI';
  }
}

function tokenize_video(md, options) {
  function tokenize_return(tokens, idx) {
    var videoID = md.utils.escapeHtml(tokens[idx].videoID);
    options.list = md.utils.escapeHtml(tokens[idx].list);
    var service = md.utils.escapeHtml(tokens[idx].service).toLowerCase();

    if (service === 'htmlvideo') {
        return '<div class="embed-responsive"><video controls><source src="' + videoID + '"></video></div>';
    }

    return videoID === '' ? '' :
      '<div class="embed-responsive"><iframe class="embed-responsive-item" id="' +
      service + 'player" type="text/html" width="' + (options[service].width) +
      '" height="' + (options[service].height) +
      '" src="' + options.url(service, videoID, options) +
      '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>';
  }

  return tokenize_return;
}

var defaults = {
  url: video_url,
  youtube: {
    width: 640,
    height: 390
  },
  vimeo: {
    width: 500,
    height: 281
  },
  vine: {
    width: 600,
    height: 600,
    embed: 'simple'
  },
  prezi: {
    width: 550,
    height: 400
  },
  htmlvideo: {
    width: 550,
    height: 400
  }
};

module.exports = function video_plugin(md, options) {
  if (options) {
    Object.keys(defaults).forEach(function (key) {
      if (typeof options[key] === 'undefined') {
        options[key] = defaults[key];
      }
    });
  } else {
    options = defaults;
  }
  md.renderer.rules.video = tokenize_video(md, options);
  md.inline.ruler.before('emphasis', 'video', video_embed(md, options));
};
