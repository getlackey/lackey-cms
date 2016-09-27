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

module.exports = {
    toMarkdown(html) {
            return toMarkdown(html);
        },
        toHTML(markdown, parentTag) {
            if (module.exports.isInline(parentTag)) {
                return marked.renderInline(markdown);
            }
            return marked.render(markdown);
        },
        isInline(tag) {
            return inline.indexOf(tag ? tag.toLowerCase() : undefined) !== -1;
        }
};
