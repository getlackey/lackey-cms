/* jslint esnext:true, node:true */
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

const SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    SCli = require(LACKEY_PATH).cli,
    Model = objection.Model;


module.exports = SUtils.deps(
    SUtils.cmsMod('core').model('objection'),
    require('./knex')
).promised((ObjectionWrapper) => {

    class MediaModel extends Model {
        static get tableName() {
            return 'media';
        }

        static get jsonSchema() {
            return {
                type: 'object',
                properties: {
                    name: {
                        type: 'string'
                    },
                    source: {
                        type: ['object', 'array']
                    },
                    attributes: {
                        type: 'object'
                    },
                    userId: {
                        type: 'integer'
                    }
                }
            };
        }
    }
    /**
     * @class
     */

    function format(source, mime) {
        let obj = {
            type: mime ? (mime.split('/')[0]) : 'image',
            src: source
        };
        if (mime) {
            obj.mime = mime;
        }
        return obj;
    }

    class Media extends ObjectionWrapper {

        static get model() {
            return MediaModel;
        }

        static defaultSource(source) {
            let i, keys, key, entry, j, it;
            if (typeof source === 'string') {
                return format(source);
            }

            if (source.source) {
                return Media.defaultSource(source.source);
            }

            if (Array.isArray(source)) {
                for (i = 0; i < source.length; i++) {
                    entry = source[i];
                    if (typeof entry === 'string') {
                        return format(entry);
                    }
                }
                for (i = 0; i < source.length; i++) {
                    entry = source[i];
                    if (entry.src) {
                        return format(entry.src);
                    }
                }
            } else {
                keys = Object.keys(source);
                for (i = 0; i < keys.length; i++) {
                    key = keys[i];
                    if (key !== 'image') {
                        entry = source[key];
                        if (typeof entry === 'string') {
                            return format(entry, key, key);
                        }
                        if (Array.isArray(entry)) {
                            for (j = 0; j < entry.length; j++) {
                                it = entry[j];
                                if (typeof it === 'string') {
                                    return format(it, key, key);
                                } else if (it.src) {
                                    return format(it.src, key, key);
                                }

                            }
                        }
                    }
                }
            }
            return {};
        }

        static videoSources(source) {
            if (typeof source === 'string') {
                return {
                    src: source
                };
            }
            if (source.source) {
                return Media.videoSources(source.source);
            }
            if (!Array.isArray(source)) {
                let sources = [];
                Object.keys(source).forEach((key) => {
                    if (key === 'image') return null;
                    if (typeof source[key] === 'string') {
                        return sources.push({
                            type: key,
                            src: source[key]
                        });
                    }
                    source[key].forEach((elem) => {
                        sources.push({
                            type: key,
                            src: elem.src,
                            media: elem.media
                        });
                    });
                });
                return sources;
            }
            return null;
        }

        _preSave() {
            if (this._doc) {
                if (typeof this._doc.source !== 'object') {
                    this._doc.source = {
                        src: this._doc.source
                    };
                } else if (Array.isArray(this._doc.source)) {
                    //this._doc.source = JSON.stringify(this._doc.source);
                }
                delete this._doc.type;
            }

            return Promise.resolve(this);
        }

        static imageSources(source) {
            if (typeof source === 'string') {
                return {
                    src: source,
                    type: 'image'
                };
            }
            if (source.source) {
                return Media.imageSources(source.source);
            }
            console.log(source);
            if (Array.isArray(source)) {
                let out = {
                        type: 'image'
                    },
                    srcset = [];
                source.forEach((elem) => {
                    if (typeof elem === 'string' && !out.src) {
                        out.src = elem;
                        srcset.push(elem);
                        return;
                    }
                    if (!out.src) {
                        out.src = elem.src;
                    }
                    srcset.push(elem.src + ' ' + elem.dimension);
                });
                if (srcset.length) {
                    out.srcset = srcset.join(',');
                }
                return out;
            }
            return source;
        }

        static sources(source) {
            let def = Media.defaultSource(source);
            if (def.type === 'video') {
                return Media.videoSources(source);
            }
            return Media.imageSources(source);
        }

        get source() {
            return this._doc.source;
        }

        get type() {
            let type = this.default.type;
            if (type === 'src') return 'image';
            return type;
        }

        get mime() {
            let mime = this.default.mime;
            if (mime === 'src') return 'image/*';
            return mime;
        }

        get default() {
            return Media.defaultSource(this.source);
        }

        get sources() {
            return Media.sources(this.source);
        }

        toJSON() {
            return {
                id: this.id,
                $uri: this.uri,
                name: this.name,
                sources: this._doc.source,
                default: this.default,
                mime: this.mime,
                type: this.type,
                createdAt: this._doc.createdAt,
                author: this._doc._userId
            };
        }

        get uri() {
            return '/api/media/' + this._doc.id.toString();
        }

        static findByPath(path) {
            SCli.debug('lackey-cms/modules/media/server/models/media', 'findByPath ' + path);
            return SCli.sql(MediaModel
                    .query()
                    .whereRaw("source->>'src' = ?", [path]))
                .then((result) => {
                    if (!result) {
                        return null;
                    }
                    return new Media(result[0]);
                });
        }

    }

    Media.generator = require('./generator');
    return Media;
});
