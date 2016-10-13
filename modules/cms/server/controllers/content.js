/* jslint esnext:true, node:true */
/* eslint no-return-assign:0 */
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
    slug = require('slug'),
    shortid = require('shortid');

module.exports = SUtils.waitForAs('contentCtrl',
        SUtils.cmsMod('core').model('content'),
        SUtils.cmsMod('core').model('template'),
        SUtils.cmsMod('core').model('taxonomy'),
        SUtils.cmsMod('core').controller('crud')
    )
    .then((Model, Template, Taxonomy, Crud) => {
        class ContentCtrl extends Crud {

            static get model() {
                return this._overriden('model', Model);
            }

            static get field() {
                return this._overriden('field', 'content');
            }

            static get tableConfig() {
                return this._overriden('tableConfig', {
                    createdAt: {
                        label: 'Created Date',
                        date: true
                    },
                    author: {
                        label: 'Author',
                        parse: 'return arguments[0] ? arguments[0].name : \'\''
                    },
                    route: {
                        label: 'URL'
                    },
                    template: {
                        name: 'Template',
                        parse: 'return arguments[0] ? arguments[0].name : \'\''
                    },
                    type: {
                        name: 'Type'
                    },
                    state: {
                        name: 'Status',
                        label: 'Status'
                    },
                    restrictiveTaxonomies: {
                        label: 'Restrictions',
                        parse: 'return arguments[1].taxonomies ? arguments[1].taxonomies.filter(function(r){return r.type.restrictive === true;}).map(function(r) { return r.label || r.name;}) : \'\'',
                        help: 'Tags used to restrict user access'
                    },
                    nonRestrictiveTaxonomies: {
                        label: 'Search Tags',
                        parse: 'return arguments[1].taxonomies ? arguments[1].taxonomies.filter(function(r){return r.type.restrictive !== true;}).map(function(r) { return r.label || r.name;}) : \'\'',
                        help: 'Tags used to assist search results'
                    }
                });
            }

            static get tableOptions() {
                return this._overriden('tableOptions', {
                    sorts: [{
                        field: 'createdAt',
                        label: 'Created At',
                        ascSuffix: 'to Most recently added',
                        descSuffix: 'to Least recently added'
                    }, {
                        field: 'route',
                        label: 'Route',
                        ascSuffix: 'to Title - A-Z',
                        descSuffix: 'to Title - Z-A'
                    }]
                });
            }

            static unique(route, originalRoute) {
                let self = this;
                return this.model
                    .getByTypeAndRoute('page', route)
                    .then(instance => instance ? self.unique(originalRoute + '-' + shortid.generate(), originalRoute) : route);
            }

            static create(req, res) {

                if (!req.body) return res.error(req, new Error('No input'));
                if (!req.body.templateId) return res.error(req, new Error('No template id given'));
                if (!req.body.name) return res.error(req, new Error('No name given'));

                req.body.templateId = 1 * req.body.templateId;
                req.body.type = 'page';

                let self = this;

                Template
                    .findById(req.body.templateId)
                    .then(template => {

                        let prefix = template.prefix || '/',
                            route = prefix + slug(req.body.name);

                        return self.unique(route, route);
                    })
                    .then(url => req.body.route = url)
                    .then(() => self.model.create(req.body))
                    .then(instance => res.api(instance))
                    .catch(error => {
                        console.error(error);
                        res.error(req, error);
                    });
            }

            static get actions() {
                return this._overriden('actions', [{
                    label: 'View',
                    icon: 'img/cms/cms/svg/preview.svg',
                    href: 'admin{route}'
                }, {
                    label: 'Remove',
                    icon: 'img/cms/cms/svg/close.svg',
                    api: 'DELETE:/cms/content/{id}'
                }]);
            }

            static cmsList(req, res) {
                Model
                    .list({
                        type: 'page'
                    })
                    .then((data) => {
                        res.js('js/cms/pages.js');
                        res.print('cms/cms/pages', {

                            list: data.map((content) => {
                                return content.toJSON();
                            })

                        });
                    }, (error) => {
                        res.error(req, error);
                    });

            }

            static cmsEdit(req, res) {
                if (req.content) {
                    Template
                        .list()
                        .then((templates) => {
                            res.js('js/cms/pages.js');
                            res.print('cms/cms/contentedit', {
                                content: req.content.toJSON(),
                                types: Model.getTypes(),
                                templates: templates.map((template) => {
                                    return template.toJSON();
                                })

                            });
                        }, req.error);
                } else {
                    res.error404(req);
                }
            }

            static createPage(req, res) {
                Template
                    .selectable(req.admin)
                    .then((templates) => {
                        res.css('css/cms/cms/table.css');
                        res.js('js/cms/cms/new-page.js');
                        res.print('cms/cms/page-create', {
                            types: Model.getTypes(),
                            templates: templates
                                .map((template) => {
                                    return template.toJSON();
                                })
                        });
                    }, req.error);
            }

            static removeTaxonomy(req, res) {
                let self = this;
                this
                    .taxonomyFromQuery(Taxonomy, {
                        type: req.taxonomyTypeName,
                        name: req.taxonomyName
                    })
                    .then(taxonomy => {
                        return req[self.field].removeTaxonomy(taxonomy);
                    })
                    .then(() => {
                        return res.api(req[self.field]);
                    }, error => {
                        console.error(error);
                        return res.error(error);
                    });
            }


            static generateSitemap() {

                return Model.list({
                        type: 'page',
                        state: 'published'
                    })
                    .then((list) => {
                        return list.map((item) => {
                            return {
                                url: item.route,
                                lastmod: new Date()
                            };
                        });
                    });
            }

        }
        return Promise.resolve(ContentCtrl);
    });
