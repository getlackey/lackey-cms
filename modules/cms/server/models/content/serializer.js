/*jslint node:true, nomen: true, esnext:true */
'use strict';
/*
    Copyright 2015 Enigma Marketing Services Limited

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

const browser = require('../../lib/dust/editable').browser,
    format = require('prosemirror/dist/format'),
    parseFrom = format.parseFrom,
    BbPromise = require('bluebird'),
    _ = require('lodash'),
    toMarkdown = require('prosemirror/dist/markdown').toMarkdown,
    SUtils = require(LACKEY_PATH).utils,
    mediaModule = SUtils.cmsMod('media');

let mediaGenerator, Media;

module.exports.deserializeText = (text) => {
    return browser.then((window) => {
        return parseFrom(window.LackeySchema, text.replace(/\\n/g, '  '), 'markdown').toJSON();
    });
};

module.exports.serializeText = (node) => {
    return browser.then(() => {
        return toMarkdown(parseFrom(window.LackeySchema, node, 'json')).replace(/\s\s\r\n/g, ' \\n');
    });
};

function crawl(data) {

    if (!data) return BbPromise.resolve(data);

    if (typeof data === 'string') {
        return module.exports.deserializeText(data);
    }

    if (data.type === 'doc') {
        return BbPromise.resolve(data);
    }

    if (data.type === 'Media') {
        return mediaGenerator(data).then((media) => {
            return {
                type: 'Media',
                id: media.id
            };
        });
    }

    let calls = [];

    ['fields', 'variants'].forEach((group) => {
        if (data[group]) {
            Object.keys(data[group]).forEach((key) => {
                let content = data[group][key];
                calls.push(() => {
                    return crawl(content).then((output) => {
                        data[group][key] = output;
                    });
                });
            });
        }
    });


    if (data.type === 'Fields') {
        Object.keys(data).forEach((key) => {
            if (['type'].indexOf(key) === -1) {
                let content = data[key];
                calls.push(() => {
                    return crawl(content).then((output) => {
                        data[key] = output;
                    });
                });
            }
        });
    }

    ['items'].forEach((group) => {
        if (data[group]) {
            data[group].forEach((content, idx) => {
                calls.push(() => {
                    return crawl(content).then((output) => {
                        data[group][idx] = output;
                    });
                });
            });
        }
    });


    if (calls.length) {
        return SUtils.serialPromise(calls, (call) => call()).then(() => {
            return data;
        });
    }
    return BbPromise.resolve(data);
}

function crawlBack(data) {
    if (data) {
        if (data.type === 'doc') {
            return module.exports.serializeText(data);
        } else if (data.type === 'Media' && data.id) {
            return Media.findById(data.id)
                .then((medium) => {
                    let med = {
                        type: 'Media',
                        source: medium.source
                    };
                    if (medium.attributes && Object.keys(medium.attributes).length) {
                        med.attributes = medium.attributes;
                    }
                    return med;
                });
        }
    }

    let promises = [];

    ['fields', 'variants', 'items'].forEach((group) => {
        if (data[group]) {
            Object.keys(data[group]).forEach((key) => {
                let content = data[group][key];
                promises.push(crawlBack(content).then((output) => {
                    data[group][key] = output;
                }));
            });
        }
    });

    if (data.type === 'Fields') {
        Object.keys(data).forEach((key) => {
            if (['type'].indexOf(key) === -1) {
                let content = data[key];
                promises.push(crawlBack(content).then((output) => {
                    data[key] = output;
                }));
            }
        });
    }

    if (promises.length) {
        return BbPromise.all(promises).then(() => {
            return data;
        });
    }
    return BbPromise.resolve(data);
}

module.exports.serialize = (content) => {
    let output = _.cloneDeep(content);
    return mediaModule.model('media')
        .then((media) => {
            Media = media;
            return crawlBack(output.layout).then((layout) => {
                output.layout = JSON.parse(JSON.stringify(layout));
                return output;
            });
        });
};

module.exports.deserialize = (content) => {
    let output = _.cloneDeep(content);

    return mediaModule.model('media')
        .then((media) => {
            mediaGenerator = media.generator;
            Media = media;
            return crawl(output.layout, true);
        }).then((layout) => {
            output.layout = layout;
            return output;
        });
};
