/* eslint no-underscore-dangle:0 */
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

const SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    SCli = require(LACKEY_PATH).cli,
    Model = objection.Model,
    _ = require('lodash');

module.exports = SUtils.deps(
    SUtils.cmsMod('core').model('objection'),
    SUtils.cmsMod('users').model('user'),
    require('../taxonomy'),
    require('../template'),
    require('./knex')
).promised((ObjectionWrapper, User, Taxonomy, Template) => {

    class ContentModel extends Model {
        static get tableName() {
            return 'content';
        }

        static get jsonSchema() {
            return {
                type: 'object',
                required: ['type', 'route'],
                properties: {
                    type: {
                        type: 'string',
                        default: 'page'
                    },
                    name: {
                        type: 'string'
                    },
                    layout: {
                        type: 'object'
                    },
                    props: {
                        type: 'object'
                    },
                    route: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    },
                    userId: {
                        type: 'integer'
                    },
                    templateId: {
                        type: 'integer'
                    },
                    createdAt: {
                        type: ['date', 'string']
                    }
                }
            };
        }
    }

    class ContentToTaxonomy extends Model {
        static get tableName() {
            return 'contentToTaxonomy';
        }
    }

    /**
     * @class
     */
    class Content extends ObjectionWrapper {

        static get model() {
            return ContentModel;
        }

        static get api() {
            return '/cms/content';
        }

        get type() {
            return this._doc.type;
        }

        get props() {
            return this._doc.props || {};
        }

        set props(data) {
            this._doc.props = data;
        }

        diff(data) {
            if (data && typeof data.layout === 'object' && Object.keys(data.layout).length) {
                this._doc.layout = data.layout;
            }
            return super.diff(data);
        }

        _populate() {
            let self = this;
            return User.findById(this._doc.userId)
                .then((user) => {
                    self._user = user;
                    return Template.findById(this._doc.templateId);
                })
                .then((template) => {
                    self._template = template;
                    return SCli.sql(ContentToTaxonomy
                        .query()
                        .where('contentId', self.id));
                })
                .then((taxonomyIds) => {
                    return Taxonomy.findByIds(taxonomyIds.map((row) => row.taxonomyId));
                })
                .then((taxonomies) => {
                    self.taxonomies = taxonomies;
                    return self;
                });
        }

        _preSave() {

            let self = this,
                promise;

            if (this._doc.template) {
                promise = Template.generator(this._doc.template)
                    .then((template) => {
                        if (template) self._doc.templateId = template.id;
                    });
            } else {
                promise = Promise.resolve();
            }

            return promise.then(() => {

                if (self._doc.templateId === undefined) {
                    delete self._doc.templateId;
                }

                if (self._doc.author) {
                    let author = this._doc.author;
                    if (typeof author === 'object') {
                        author = author ? author.id : null;
                    }
                    self._doc.userId = author;
                }

                delete self._doc.template;
                delete self._doc.taxonomy;
                delete self._doc.author;

                if (self._doc.layout === undefined) {
                    delete self._doc.layout;
                }
                return self;
            });
        }

        _postSave(cached) {
            let promise = Promise.resolve(this),
                self = this;
            if (cached.taxonomy) {
                promise = promise
                    .then(() => {
                        return SCli.sql(ContentToTaxonomy
                            .query()
                            .delete()
                            .where('contentId', self.id));
                    })
                    .then(() => {
                        return SCli.sql(ContentToTaxonomy
                            .query()
                            .insert(cached.taxonomy.map((id) => {
                                return {
                                    contentId: self.id,
                                    taxonomyId: id
                                };
                            })));
                    });
            }

            return promise;
        }

        toJSON() {
            return {
                id: this.id,
                $uri: this.uri,
                type: this.type,
                name: this.name,
                route: this._doc.route,
                createdAt: this._doc.createdAt,
                props: this.props,
                author: this._user ? this._user.toJSON() : null,
                template: this._template ? this._template.toJSON() : null,
                state: this._doc.state,
                layout: this._doc.layout,
                taxonomies: this.taxonomies
            };
        }

        toYAML() {
            let self = this;
            return Content.serializer
                .serialize(self.toJSON())
                .then((content) => {

                    let taxonomies = {};

                    if (content.taxonomies) {
                        content.taxonomies.forEach((taxonomy) => {
                            if (!taxonomies[taxonomy.type.name]) {
                                taxonomies[taxonomy.type.name] = [];
                            }
                            taxonomies[taxonomy.type.name].push(taxonomy.name);
                        });
                    }

                    return {
                        type: content.type,
                        route: content.route,
                        props: content.props || {},
                        createdAt: content.createdAt || null,
                        template: content.template ? content.template.path : '',
                        taxonomies: taxonomies,
                        layout: content.layout
                    };
                });

        }

        addTaxonomy(taxonomy) {
            let self = this;
            return SCli.sql(ContentToTaxonomy
                    .query()
                    .insert({
                        contentId: this.id,
                        taxonomyId: taxonomy.id
                    }))
                .then(() => {
                    return self._populate();
                });
        }

        removeTaxonomy(taxonomy) {
            let self = this;
            return SCli.sql(ContentToTaxonomy
                    .query()
                    .remove()
                    .where('contentId', this.id)
                    .where('taxonomyId', taxonomy.id)
                )
                .then(() => {
                    return self._populate();
                });
        }

        get route() {
            return this._doc.route;
        }


        get layout() {
            return this._doc.layout;
        }

        set layout(data) {
            this._doc.layout = data;
        }

        get uri() {
            if (!this._doc || !this._doc.id) return null;
            return '/api/cms/content/' + this._doc.id.toString();
        }

        get state() {
            return this._doc.state;
        }

        getTemplatePath() {

            SCli.debug('lackey-cms/modules/cms/server/models/page', 'Get template path', (this._template && this._template.path && this._template.path.length) ? 'exists' : 'doesn\'t exist');

            if (this._template && this._template.path && this._template.path.length) {
                return this._template.path.toString();
            }
            return ['~/core/notemplate', 'cms/cms/notemplate', 'cms/cms/page'];
        }

        static getTypes() {
            return [
                'page',
                'block',
                'quote'
            ];
        }

        static getByTypeAndRoute(type, route) {
            return SCli.sql(ContentModel
                    .query()
                    .where('route', route)
                    .where('type', type))
                .then((results) => {
                    if (results && results.length) {
                        return new Content(results[0]);
                    }
                    return null;
                });
        }

        static findByRoute(route) {
            return this.findOneBy('route', route);
        }

        static getByTaxonomies(taxonomyIds, limit, order, excludeId) {

            let promise;

            if (taxonomyIds.length) {

                promise = Promise.all(taxonomyIds.map((taxonomyId) => {
                    return SCli.sql(ContentToTaxonomy
                            .query()
                            .where('taxonomyId', taxonomyId))
                        .then((list) => list.map((entry) => entry.contentId));
                })).then((lists) => _.intersection.apply(null, lists));
            } else {
                promise = Promise.resolve(null);
            }

            return promise
                .then((list) => {

                    let query = ContentModel.query();
                    if (list) {
                        query = query.whereIn('id', list);
                    }
                    if (excludeId) {
                        query = query.whereNotIn('id', [excludeId]);
                    }

                    return SCli.sql(query
                        .orderBy('createdAt', 'DESC')
                        .limit(limit)
                    );

                })
                .then((results) => {
                    return results.map((result) => result.route);
                });
        }
    }
    Content.generator = require('./generator');
    Content.serializer = require('./serializer');
    return Content;
});
