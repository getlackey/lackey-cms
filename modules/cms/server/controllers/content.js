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

            static create(req, res) {

                if (!req.body) return res.error(req, new Error('No input'));
                if (!req.body.route) return res.error(req, new Error('No route given'));
                if (!req.body.templateId) return res.error(req, new Error('No template id given'));

                req.body.templateId = 1 * req.body.templateId;

                this.model
                    .getByTypeAndRoute('page', req.body.route)
                    .then((instance) => {
                        if (instance) {
                            throw new Error('Given route is already taken');
                        }
                        req.body.type = 'page';
                        return this.model.create(req.body);
                    })
                    .then((instance) => {
                        res.api(instance);
                    }, function (error) {
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

            static taxonomyFromQuery(body) {
                let promise = null;
                if (!body.type) {
                    throw new Error('Type required');
                }
                if (body.name) {
                    promise = Taxonomy.byTypeAndName(body.type, body.name);
                } else if (body.label) {
                    promise = Taxonomy.byTypeAndLabel(body.type, body.label);
                }

                if (!promise) {
                    return Promise.reject(new Error('Wrong params'));
                }
                return promise;
            }

            static addTaxonomy(req, res) {
                this
                    .taxonomyFromQuery(req.body).then((taxonomy) => {
                        return req.content.addTaxonomy(taxonomy);
                    })
                    .then(() => {
                        return res.api(req.content);
                    }, (error) => {
                        console.error(error.message);
                        console.error(error.stack);
                        return res.error(error);
                    });
            }

            static removeTaxonomy(req, res) {
                this
                    .taxonomyFromQuery({
                        type: req.taxonomyTypeName,
                        name: req.taxonomyName
                    })
                    .then((taxonomy) => {
                        return req.content.removeTaxonomy(taxonomy);
                    })
                    .then(() => {
                        return res.api(req.content);
                    }, (error) => {
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
