/*jslint node:true, nomen: true, esnext:true */
/* globals LACKEY_PATH, window */
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

const
    SUtils = require(LACKEY_PATH).utils,
    SCli = require(LACKEY_PATH).cli,
    CMS = SUtils.cmsMod('cms'),
    CORE = SUtils.cmsMod('core'),
    format = require('prosemirror/dist/format'),
    parseFrom = format.parseFrom,
    _ = require('lodash'),
    toMarkdown = require('prosemirror/dist/markdown').toMarkdown,
    MODULE_NAME = 'lackey-cms/modules/cms/server/model/content/serializer';

let mediaGenerator,
    Media,
    browser = CMS
    .path('server/lib/dust/editable')
    .then((editable) => editable.browser);

module.exports.deserializeText = text => {
    return Promise.resolve(text);
};

module.exports.serializeText = node => {
    SCli.debug(MODULE_NAME, 'serializeText');
    return browser.then(() => {
        return toMarkdown(parseFrom(window.LackeySchema, node, 'json')).replace(/\s\s\r\n/g, ' \\n');
    });
};

function crawl(data) {
    SCli.debug(MODULE_NAME, 'crawl');
    if (!data) {
        return Promise.resolve(data);
    }

    if (typeof data === 'string') {
        return module.exports.deserializeText(data);
    }

    if (data.type === 'doc') {
        return Promise.resolve(data);
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

    ['fields', 'variants', 'items'].forEach((group) => {
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


    if (data.type === 'Fields' || data.type === 'Variants') {
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

    if (calls.length) {
        return SUtils.serialPromise(calls, (call) => call()).then(() => {
            return data;
        });
    }
    return Promise.resolve(data);
}

function crawlBack(data) {
    SCli.debug(MODULE_NAME, 'crawlBack');
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
    } else {
        return Promise.resolve(null);
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

    if (data.type === 'Fields' || data.type === 'Variants') {
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
        return Promise.all(promises).then(() => {
            return data;
        });
    }
    return Promise.resolve(data);
}

module.exports.serialize = content => {
    SCli.debug(MODULE_NAME, 'serialize');
    let output = _.cloneDeep(content);
    return CORE
        .model('media')
        .then(media => {
            SCli.debug(MODULE_NAME, 'got media');
            Media = media;
            return crawlBack(output.layout).then(layout => {
                output.layout = JSON.parse(JSON.stringify(layout));
                return output;
            });
        });
};

module.exports.deserialize = content => {
    SCli.debug(MODULE_NAME, 'deserialize');
    let output = _.cloneDeep(content);

    return CORE
        .model('media')
        .then(media => {
            mediaGenerator = media.generator;
            Media = media;
            return crawl(output.layout, true);
        }).then(layout => {
            output.layout = layout;
            return output;
        });
};
