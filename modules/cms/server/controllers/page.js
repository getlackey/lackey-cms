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

const SCli = require(LACKEY_PATH).cli,
    SUtils = require(LACKEY_PATH).utils;

module.exports = SUtils
    .deps(
        require('../models/content'),
        require('../models/taxonomy'),
        require('../models/taxonomy-type')
    )
    .promised((ContentModel, Taxonomy, TaxonomyType) => {

        class PageController {

            static preview(req, res, next) {
                let data = JSON.parse(req.body.preview),
                    fullPath = req.protocol + '://' + req.get('host') + data.location;

                ContentModel
                    .findByRoute(data.location)
                    .then((page) => {
                        if (page) {
                            page.layout = data.contents.layout;
                            page.props = data.contents.props;
                            return PageController.print(page, fullPath, res, req, true);
                        }
                        next();
                    });


            }

            static print(page, fullPath, res, req, preview) {

                let path, edit = req.user && req.user.getACL('edit').length > 0,
                    javascripts = req.user ? [
                                    preview ? 'js/cms/cms/preview.js' : 'js/cms/cms/page.js'
                                ] : [],
                    stylesheets = [],
                    pageJson = page.toJSON(),
                    data = {
                        route: fullPath,
                        content: pageJson
                    },
                    promise = Promise.resolve(data);

                if (page.state !== 'published' && !edit) {
                    return res.error403(req);
                }

                if (pageJson.template) {
                    if (pageJson.template.javascripts) {
                        javascripts = javascripts.concat(pageJson.template.javascripts);
                    }
                    if (pageJson.template.stylesheets) {
                        stylesheets = stylesheets.concat(pageJson.template.stylesheets);
                    }

                    if (pageJson.template.populate && pageJson.template.populate.length) {
                        promise = PageController.populate(data, pageJson.template.populate, req, page);
                    }
                }

                res.css(stylesheets);
                res.js(javascripts);

                path = page.getTemplatePath();

                SCli.debug('lackey-cms/modules/cms/server/controllers/page', path);

                if (req.query.variant && req.query.variant) {
                    if (req.user && req.user.getACL('viewInContext')) {
                        path = req.query.variant;
                    }
                }

                res.edit(edit);

                promise.then((result) => {
                    res.print(path, result);
                }, (error) => {
                    console.log(error);
                    res.error(error);
                });

            }

            static populate(target, populate, req, page) {
                return Promise.all(populate.map((item) => PageController.populateOne(target, item, req, page)))
                    .then(() => target);
            }

            static populateOne(target, item, req, page) {
                switch (item.type) {
                case 'Taxonomy':
                    return PageController.populateTaxonomy(target, item, req);
                case 'Content':
                    return PageController.populateContent(target, item, req, page);
                default:
                    return Promise.resolve();
                }
            }

            static populateContent(target, item, req, page) {
                return Promise.all(item.taxonomy.map((taxonomy) => {
                    let queryValue = PageController.parse(taxonomy, req, page);
                    if (!queryValue || !queryValue.length) return Promise.resolve(null);
                    return PageController.taxonomyType(taxonomy.type)
                        .then((taxonomyTypeId) => {
                            return SCli
                                .sql(Taxonomy.model.query()
                                    .where('taxonomyTypeId', taxonomyTypeId)
                                    .whereIn('name', queryValue))
                                .then((tax) => {
                                    return tax[0] ? tax[0].id : null;
                                });
                        });
                })).then((taxonomies) => {
                    let taxes = taxonomies.filter((tax) => !!tax),
                        pageNumber = item.page ? PageController.parse(item.page, req) : 0;
                    return ContentModel.getByTaxonomies(taxes, item.limit, pageNumber, item.order, item.excludeContentId ? page.id : null);
                }).then((results) => {
                    target[item.field] = results;
                });
            }

            static populateTaxonomy(target, item, req) {
                return PageController.taxonomyType(item.taxonomyType)
                    .then((taxonomyTypeId) => {
                        return Taxonomy.findBy('taxonomyTypeId', taxonomyTypeId)
                            .then((list) => {
                                target[item.field] = list.map((result) => {
                                    let res = result.toJSON();
                                    if (item.selected && res.name === PageController.parse(item.selected, req)) {
                                        res.selected = true;
                                    }
                                    return res;
                                });
                            });
                    });
            }

            static taxonomyType(name) {
                return TaxonomyType
                    .findOneBy('name', name)
                    .then((taxonomyType) => taxonomyType.id);
            }

            static parse(query, req, page) {
                if (query.source === 'query') {
                    return req.query[query.field];
                } else if (query.source === 'content') {
                    if (page.taxonomies) {
                        let res = [];
                        page.taxonomies.forEach((tax) => {
                            if (tax.type.name === query.type) {
                                res.push(tax.name);
                            }
                        });
                        return res;
                    }
                }
                return [query.value] || null;
            }

            static capture(req, res, next) {

                let route = req.route.replace(/\..*$/, ''),
                    fullPath = req.protocol + '://' + req.get('host') + route;

                route = route.replace(/\?.*$/, '');

                if (route === '') {
                    route = '/';
                }

                route = decodeURIComponent(route);

                ContentModel
                    .findByRoute(route)
                    .then((page) => {
                        if (page) {

                            if (req.__resFormat === 'yaml') {
                                return page.toYAML()
                                    .then((yaml) => {
                                        return res.yaml(yaml);
                                    });
                            }

                            return PageController.print(page, fullPath, res, req);
                        }
                        next();
                    });
            }
        }

        return PageController;
    });
