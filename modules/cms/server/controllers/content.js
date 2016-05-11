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
                return Model;
            }

            static get field() {
                return 'content';
            }

            static get tableConfig() {
                return {
                    createdAt: {
                        label: 'Created at',
                        date: true
                    },
                    author: {
                        label: 'Author',
                        parse: 'return arguments[0] ? arguments[0].name : \'\''
                    },
                    route: {
                        label: 'Route'
                    },
                    template: {
                        name: 'Template',
                        parse: 'return arguments[0] ? arguments[0].name : \'\''
                    },
                    type: {
                        name: 'Type'
                    },
                    state: {
                        name: 'Status'
                    }
                };
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
                return [{
                    label: 'View',
                    icon: 'img/cms/cms/svg/preview.svg',
                    href: 'admin{route}'
                }, {
                    label: 'Remove',
                    icon: 'img/cms/cms/svg/close.svg',
                    api: 'DELETE:/cms/content/{id}'
                }];
            }

            static cmsList(req, res) {
                Model
                    .list({
                        type: 'page'
                    })
                    .then((data) => {
                        res.send({
                            template: 'cms/cms/pages',
                            javascripts: [
                                'js/cms/pages.js'
                            ],
                            data: {

                                list: data.map((content) => {
                                    return content.toJSON();
                                })
                            }
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

                            res.send({
                                template: 'cms/cms/contentedit',
                                javascripts: [
                                    'js/cms/pages.js'
                                ],
                                data: {
                                    content: req.content.toJSON(),
                                    types: Model.getTypes(),
                                    templates: templates.map((template) => {
                                        return template.toJSON();
                                    })
                                }
                            });
                        }, req.error);
                } else {
                    res.error404(req);
                }
            }

            static createPage(req, res) {
                Template.selectable()
                    .then((templates) => {

                        res.send({
                            template: 'cms/cms/page-create',
                            stylesheets: ['css/cms/cms/table.css'],
                            javascripts: [
                                'js/cms/cms/new-page.js'
                            ],
                            data: {
                                types: Model.getTypes(),
                                templates: templates.map((template) => {
                                    return template.toJSON();
                                })
                            }
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
