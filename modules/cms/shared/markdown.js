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
    marked = new MarkdownIt(),
    inline = ['h1', 'h2', 'h3', 'h4', 'h5'],
    toMarkdown = require('to-markdown');

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
        toHTML(markdown, parentTag) {
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
