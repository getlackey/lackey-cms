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
    limitations under the License.
*/
if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const marked = require('marked'),
    path = require('path'),
    fs = require('fs');

module.exports = (dust) => {

    dust.helpers.markdown = function (chunk, context, bodies, params) {
        return chunk.map((instance) => {
            fs.readFile(params.file, 'utf8', (error, content) => {

                if (error) {
                    return instance.end(error.toString());
                }

                let parsed = marked(content),
                    links = parsed.match(/href="([^"]+)"/g),
                    pathDirname = (/\.md/).test(params.path) ? path.dirname(params.path) : params.path;

                links.forEach((link) => {
                    if (!(/^[a-zA-Z]:\/\//).test(link)) {
                        let parts = link.match(/href="([^"]+)"/),
                            isAbsolute = parts[1][0] === '/',
                            absolute = path.join(params.root, parts[1]),
                            relative = (pathDirname + parts[1].replace(/^\.\//, '/')),
                            dest = isAbsolute ? absolute : relative;

                        parsed = parsed.replace(parts[0], 'href="' + dest + '"');
                    }
                });
                instance.write(parsed);
                instance.end();
            });
        });
    };
};
