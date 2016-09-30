/* jslint node:true, esnext:true */
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
*/
const
    MarkdownIt = require('markdown-it'),
    inline = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'time'],
    toMarkdown = require('to-markdown');

var yt_regex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
function youtube_parser (url) {
  var match = url.match(yt_regex);
  return match && match[7].length === 11 ? match[7] : url;
}

/*eslint-disable max-len */
var vimeo_regex = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
/*eslint-enable max-len */
function vimeo_parser (url) {
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

    if (state.src.charCodeAt(oldPos) !== 0x40/* @ */ ||
        state.src.charCodeAt(oldPos + 1) !== 0x5B/* [ */) {
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

 function imagizer(md, options) {

  md.renderer.rules.video = tokenize_video(md, options);
  md.inline.ruler.before('emphasis', 'video', video_embed(md, options));
}


module.exports = {
    toMarkdown(html) {
            try {
                return toMarkdown(html);
            } catch (err) {
                console.error(err);
                console.error(err.stack);
                return html;
            }
        },
        toHTML(markdown, parentTag, editMode) {

            let marked = new MarkdownIt();
                marked.use(imagizer);
            if (editMode) {

            } else {

                marked
                    .use(require('markdown-it-video', {
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
                        }
                    }));

            }

            try {
                if (module.exports.isInline(parentTag)) {
                    return marked.renderInline(markdown);
                }
                return marked.render(markdown);
            } catch (err) {
                console.error(err);
                console.error(err.stack);
                return markdown;
            }
        },
        isInline(tag) {
            return inline.indexOf(tag ? tag.toLowerCase() : undefined) !== -1;
        }
};
