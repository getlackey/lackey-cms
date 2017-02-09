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

const SUtils = require(LACKEY_PATH).utils;

function isObject(obj) {
    return obj === Object(obj);
}

function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}

function crawl(thing) {
    var p = [];
    if (isObject(thing)) {
        if (thing.type && thing.type === 'Media') {
            return Promise.resolve(thing.id);
        } else {
            Object.keys(thing).forEach(function (key) {
                p.push(crawl(thing[key]));
            });
            return Promise.all(p);
        }
    } else if (Array.isArray(thing)) {
        thing.forEach(function (key) {
            p.push(crawl(thing[key]));
        });
        return Promise.all(p);
    } else {
        return Promise.resolve(0);
    }
}

module.exports = SUtils
    .waitForAs('mediaCtrl',
        SUtils.cmsMod('core').model('media'),
        SUtils.cmsMod('core').controller('crud')
    )
    .then((Model, Crud) => {
        class Controller extends Crud {

            static get model() {
                return this._overriden('model', Model);
            }

            static get field() {
                return this._overriden('field', 'media');
            }

            static get tableConfig() {
                return this._overriden('tableConfig', {
                    name: {
                        label: 'Name'
                    },
                    mime: {
                        label: 'Type'
                    },
                    createdAt: {
                        label: 'Created At',
                        date: true
                    },
                    source: {
                        label: 'Source'
                    }
                });
            }

            static get tableRowAction() {
                return this._overriden('tableRowAction', {
                    href: 'cms/media/{id}',
                    template: 'cms/core/media-modal'
                });
            }

            static get filterOptions() {
                return this._overriden('filterOptions', {
                    template: 'media-filter'
                });
            }

            static create(req, res) {
                if (req.body.source) {
                    return Model
                        .create(req.body)
                        .then((model) => {
                            res.api(model);
                        }, (error) => {
                            res.error(req, error);
                        });
                } else {
                    res.error(new Error('You are nasty'));
                }
            }

            static details(req, res) {
                Model
                    .findById(req.params.media_id)
                    .then(media => {
                        if (media) {
                            res.css('css/cms/cms/media.css');
                            res.js('js/cms/cms/context.js');
                            res.print('cms/cms/media', {
                                media: media.toJSON(false)
                            });
                        } else {
                            res.redirect('cms/media');
                        }
                    });
            }


            static ensureUnique(req, res) {
                let Content;
                SUtils.cmsMod('core').model('content')
                .then((content) => {
                    Content = content;

                    return Content.find();
                })
                .then((contents) => {
                    var promises = [];

                    contents.forEach((content) => {
                        promises.push(crawl(content.layout));
                    });
                    return Promise.all(promises);
                })
                .then((items) => {
                    return flatten(items).filter(Boolean);
                }).then((existingMedia) => {
                    Model.find().then((models) => {
                        models.forEach((model) => {
                            if (existingMedia.indexOf(model.id) > -1) {
                                console.log(model.id);
                            } else {
                                model.remove();
                            }
                        });
                        res.api('done');
                    });
                });
            }
        }

        return Promise.resolve(Controller);
    });
