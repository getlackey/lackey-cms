/* eslint no-underscore-dangle:0 */
/* jslint node:true, esnext:true */
/* globals LACKEY_PATH */
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

const SUtils = require(LACKEY_PATH).utils,
    SCli = require(LACKEY_PATH).cli,
    objection = require('objection'),
    Model = objection.Model,
    languageTags = require('language-tags'),
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/content';

SCli.debug(__MODULE_NAME, 'REQUIRED');

module.exports = SUtils
    .waitForAs(__MODULE_NAME,
        SUtils.cmsMod('core').model('taggable'),
        SUtils.cmsMod('core').model('user'),
        require('../taxonomy'),
        require('../template'),
        require('../knex'),
        require('./querybuilder'),
        require(LACKEY_PATH).configuration()

    )
    .then((Taggable, User, Taxonomy, Template, knexSchema, QueryBuilder, configuration) => {

        SCli.debug(__MODULE_NAME, 'READY');

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
                        plaintext: {
                            type: 'string'
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
                        authorId: {
                            type: 'integer'
                        },
                        templateId: {
                            type: 'integer'
                        },
                        createdAt: {
                            type: ['date', 'string']
                        },
                        publishAt: {
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
        class Content extends Taggable {

            static get model() {
                return ContentModel;
            }

            static get api() {
                return '/cms/content';
            }

            static get createLink() {
                return 'cms/content/create';
            }

            static get taxonomyRelationModel() {
                return ContentToTaxonomy;
            }

            static get taxonomyRelationField() {
                return 'contentId';
            }

            get type() {
                return this._doc.type;
            }

            get props() {
                let props = this._doc.props || {};
                if (!props.og_title) {
                    props.og_title = this._doc.name;
                }
                if (!props.og_url) {
                    props.og_url = configuration.get('host') + this._doc.route;
                }
                return props;
            }

            get author() {
                return this._author ? this._author.toJSON(true) : (this._user ? this._user.toJSON(true) : null);
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
                return super._populate()
                    .then(() => {
                        return User.findById(self._doc.userId);
                    })
                    .then((user) => {
                        self._user = user;
                        return User.findById(self._doc.authorId);
                    })
                    .then((user) => {
                        self._author = user;
                        return Template.findById(this._doc.templateId);
                    })
                    .then((template) => {
                        self._template = template;
                        return self;
                    });
            }

            static get likeables() {
                return {
                    route: 'lr',
                    state: 'lr',
                    type: 'lr'
                };
            }

            static _preQuery(innerQuery, options) {

                let query = JSON.parse(JSON.stringify(innerQuery));


                if (query.route) {
                    let pathParts = query.route.split('/');

                    if (languageTags(pathParts[1]).valid() || languageTags(pathParts[1]).deprecated()) {
                        pathParts.splice(0, 2);
                        query.route = '/' + pathParts.join('/');
                    }
                }
                return super._preQuery(query, options);
            }

            static _postQuery(data, query) {
                if (!data) {
                    return data;
                }

                if (query.route) {
                    let pathParts = query.route.split('/');

                    if (languageTags(pathParts[1]).valid() || languageTags(pathParts[1]).deprecated()) {
                        data.$locale = pathParts[1];
                    }
                }
                return data;
            }

            _preSave() {

                let self = this,
                    promise = super._preSave();

                if (this._doc.template) {
                    promise = promise
                        .then(() => {
                            return Template.generator(this._doc.template);
                        })
                        .then((template) => {
                            if (template) {
                                self._doc.templateId = template.id;
                            }
                        });
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
                        self._doc.authorId = author;
                    }

                    delete self._doc.template;
                    delete self._doc.author;

                    if (self._doc.layout === undefined) {
                        delete self._doc.layout;
                    } else {
                        self._doc.plaintext = self.getPlainText(self._doc.layout);
                    }

                    self._doc.route = self._doc.route.toLowerCase();

                    return self;
                });
            }

            getPlainText(object) {
                if (!object) {
                    return '';
                }
                let
                    self = this;


                if (typeof object === 'object') {
                    return (Array.isArray(object) ? object : Object.keys(object).map(key => key === 'type' ? '' : object[key]))
                        .map(item => self.getPlainText(item))
                        .filter(value => value && value.replace(/^\s+|\s+$/, '').length > 0)
                        .join('\n');
                } else if (typeof object === 'string') {
                    return object;
                }
                return null;
            }

            _postSave(cached) {
                return super._postSave(cached);
            }

            toJSON() {
                return {
                    id: this.id,
                    $uri: this.uri,
                    type: this.type,
                    name: this.name,
                    route: this._doc.route,
                    createdAt: this._doc.createdAt,
                    publishAt: this._doc.publishAt,
                    updatedAt: this._doc.updatedAt,
                    props: this.props,
                    author: this.author,
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

                        let promise = Promise.resolve();

                        if (self._author || self._user) {
                            promise = (self._author || self._user).getIdentity('email')
                                .then((email) => {
                                    if (email) {
                                        return email.accountId;
                                    }
                                    return null;
                                });
                        }

                        return promise.then((author) => {

                            return {
                                type: content.type,
                                route: content.route,
                                props: content.props || {},
                                createdAt: content.createdAt || null,
                                publishAt: content.publishAt || null,
                                template: content.template ? content.template.path : '',
                                taxonomies: taxonomies,
                                state: content.state,
                                author: author ? author : null,
                                layout: content.layout
                            };
                        }, (err) => {
                            console.error(err);
                            return err;
                        });
                    });

            }

            get route() {
                return this._doc.route;
            }

            get publishAt() {
                return this._doc.publishAt;
            }


            get layout() {
                return this._doc.layout;
            }

            set layout(data) {
                this._doc.layout = data;
            }

            get uri() {
                if (!this._doc || !this._doc.id) {
                    return null;
                }
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
                            return (new Content(results[0]))._populate();
                        }
                        return null;
                    });
            }

            static findByRoute(route) {
                return this.findOneBy('route', route.replace(/^[\n\r\s\t]+|[\n\r\s\t]+$/g, ''));
            }

            static complexQuery(options) {

                let builder = new QueryBuilder();

                builder.withTaxonomies(options.includeTaxonomies);
                builder.withoutTaxonomies(options.excludeTaxonomies);
                builder.withAuthor(options.requireAuthor);
                builder.withoutIds(options.excludeIds);

                if (!options.includeDrafts) {
                    builder.excludeDrafts();
                    builder.restrictDate();
                }

                if (options.textSearch && options.textSearch.length > 3) {
                    builder.withTextSearch(options.textSearch, options.freeTextTaxonomies || []);
                }

                return builder
                    .run(options.requestor, options.page, options.limit, options.order);

            }

            canSee(user) {

                let builder = new QueryBuilder();

                builder.withId(this.id);

                return builder
                    .run(user, 0, 1)
                    .then((results) => {
                        return results.paging.count > 0;
                    });

            }
        }
        Content.generator = require('./generator');
        Content.serializer = require('./serializer');
        return Content;
    });
