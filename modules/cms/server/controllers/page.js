/* jslint esnext:true, node:true */
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

const SCli = require(LACKEY_PATH).cli,
    SUtils = require(LACKEY_PATH).utils,
    configuration = require(LACKEY_PATH).configuration;

module.exports = SUtils
    .waitForAs('pageCtrl',
        SUtils.cmsMod('core').model('content'),
        SUtils.cmsMod('core').model('taxonomy'),
        SUtils.cmsMod('core').model('taxonomy-type'),
        SUtils.cmsMod('core').model('template')
    )
    .then((ContentModel, Taxonomy, TaxonomyType, Template) => {

        class PageController {

            static preview(req, res, next) {
                let data = JSON.parse(req.body.preview),
                    fullPath = req.protocol + '://' + req.get('host') + decodeURIComponent(data.location);

                if (req.body.locale) {
                    res.__doc.locale = req.body.locale;
                }

                ContentModel
                    .findByRoute(decodeURIComponent(data.location))
                    .then((page) => {
                        if (page) {
                            page.layout = data.contents.layout;
                            page.props = data.contents.props;
                            return PageController.print(page, fullPath, res, req, true);
                        }
                        next();
                    });


            }

            static pageAccess() {
                return configuration()
                    .then((cfg) => {
                        if (cfg.get('pagePermissions')) {
                            return cfg.get('pagePermissions');
                        }
                        return false;
                    });
            }

            static print(page, fullPath, res, req, preview) {

                let
                    path,
                    user = req.user,
                    stylesheets = [],
                    pageJson = page.toJSON(),
                    isAllowed,
                    data = {
                        route: fullPath,
                        content: pageJson
                    },
                    javascripts,
                    self = this,
                    pagePermissions,
                    promise = (user ? user.isAllowed('/admin*', 'get') : Promise.resolve(false));

                promise = promise
                    .then(allowed => {
                        if (!allowed || !user) {
                            return allowed;
                        }
                        return page._template.canEdit(user);
                    });

                return promise
                    .then((allowed) => {
                        isAllowed = allowed;
                        return;
                    })
                    .then(() => {
                        return self.pageAccess()
                            .then((perm) => {
                                pagePermissions = perm;
                                if (pagePermissions) {

                                    if (Array.isArray(pagePermissions.public)) {
                                        if (pagePermissions.public.indexOf(page.route) !== -1) {
                                            return;
                                        }
                                    }

                                    if (user) {
                                        return user.isAllowed(pagePermissions.perm, pagePermissions.method)
                                            .then((allowed) => {
                                                if (allowed) {
                                                    return;
                                                } else {
                                                    Promise.reject('403');
                                                }
                                            });
                                    }
                                    return Promise.reject('403');
                                }
                                return;
                            });
                    })
                    .then(() => {
                        javascripts = isAllowed ? [
                            preview ? 'js/cms/cms/preview.js' : 'js/cms/cms/page.js'
                        ] : [];

                        if (page.state !== 'published' && !isAllowed) {
                            return Promise.reject('403');
                        }

                        if (pageJson.template) {
                            if (pageJson.template.javascripts) {
                                javascripts = javascripts.concat(pageJson.template.javascripts);
                            }
                            if (pageJson.template.stylesheets) {
                                stylesheets = stylesheets.concat(pageJson.template.stylesheets);
                            }

                            if (pageJson.template.populate && pageJson.template.populate.length) {
                                return PageController.populate(data, pageJson.template.populate, req, page);
                            }
                        }

                        return data;
                    })
                    .then((result) => {

                        res.css(stylesheets);
                        res.js(javascripts);

                        path = page.getTemplatePath();

                        SCli.debug('lackey-cms/modules/cms/server/controllers/page', path);

                        if (req.body.variant && req.body.variant) {
                            if (req.user && req.user.getACL('viewInContext')) {
                                return Template
                                    .findById(req.body.variant)
                                    .then((template) => {
                                        res.variant(template.path);
                                        return [template.path, result];
                                    });

                            }
                        }
                        return [path, result];
                    })
                    .then((result) => {
                        res.edit(isAllowed);
                        res.print(result[0], result[1]);
                    }, (error) => {
                        console.error(error);
                        console.error(error.stack);
                        if (error === '403') {
                            return res.error403(req);
                        }
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

            static mapTaxonomyList(list, req, page) {
                return PageController
                    ._mapTaxonomyList(list, req, page)
                    .then((l) => l.map((t) => t.id));
            }

            static mapTaxonomyListGrouped(list, req, page) {
                let groups = {};
                return PageController
                    ._mapTaxonomyList(list, req, page)
                    .then((l) => l.map((t) => {
                        groups[t.taxonomyTypeId] = groups[t.taxonomyTypeId] || [];
                        groups[t.taxonomyTypeId].push(t.id);
                    }))
                    .then(() => {
                        return Object
                            .keys(groups)
                            .map((g) => {
                                return groups[g];
                            });
                    });

            }

            static _mapTaxonomyList(list, req, page) {
                return Promise.all(list.map((taxonomy) => {
                        if (taxonomy.ifNot) {
                            if (PageController.parse(taxonomy.ifNot, req, page)) {
                                return null;
                            }
                        }
                        if (taxonomy.if) {
                            if (!PageController.parse(taxonomy.if, req, page)) {
                                return null;
                            }
                        }

                        let queryValue = PageController.parse(taxonomy, req, page);
                        if (typeof queryValue === 'string') {
                            queryValue = queryValue.split(',');
                        }
                        if (!queryValue || !queryValue.length) return Promise.resolve(null);
                        return PageController
                            .taxonomyType(taxonomy.type)
                            .then((taxonomyTypeId) => {
                                return SCli
                                    .sql(Taxonomy.model.query()
                                        .where('taxonomyTypeId', taxonomyTypeId)
                                        .whereIn('name', queryValue))
                                    .then((tax) => {
                                        return tax || [];
                                    });
                            });
                    }))
                    .then((l) => l.filter((t) => !!t && t.length))
                    .then((l) => {
                        let sum = [];
                        l.forEach((t) => {
                            sum = sum.concat(t);
                        });
                        return sum;
                    });
            }

            static populateContent(target, item, req, page) {
                let includeTaxonomies,
                    excludeTaxonomies;

                return PageController
                    .mapTaxonomyListGrouped(item.taxonomy || [], req, page)
                    .then((taxonomies) => {
                        includeTaxonomies = taxonomies;
                        return PageController.mapTaxonomyList(item.excludeTaxonomy || [], req, page);
                    })
                    .then((taxonomies) => {

                        excludeTaxonomies = taxonomies;
                        let taxes = includeTaxonomies.filter((tax) => !!tax),
                            exTaxes = excludeTaxonomies.filter((tax) => !!tax),
                            pageNumber = item.page ? PageController.parse(item.page, req) : 0,
                            author = (item.author && PageController.parse(item.author.if, req, page)) ? page.author : null,
                            textSearch = item.textSearch ? PageController.parse(item.textSearch, req, page) : null;
                        return ContentModel
                            .complexQuery({
                                includeTaxonomies: taxes,
                                excludeTaxonomies: exTaxes,
                                requireAuthor: author,
                                limit: item.limit || 10,
                                page: pageNumber || 0,
                                order: item.order,
                                excludeIds: item.excludeContentId ? page.id : null,
                                requestor: req.user,
                                textSearch: textSearch
                            });

                    })
                    .then((results) => {
                        target[item.field] = results.rows;
                        if (item.paging) {
                            target[item.paging] = results.paging;
                        }
                    });
            }

            static populateTaxonomy(target, item, req) {

                let selected = PageController.parse(item.selected, req);

                if (selected) {
                    selected = selected.split(',');
                } else {
                    selected = [];
                }

                return PageController
                    .taxonomyType(item.taxonomyType)
                    .then((taxonomyTypeId) => {

                        return Taxonomy.
                        findBy('taxonomyTypeId', taxonomyTypeId);
                    })
                    .then((list) => {
                        target[item.field] = list
                            .map((result) => {
                                let res = result.toJSON();
                                if (item.selected && selected.indexOf(res.name) !== -1) {
                                    res.selected = true;
                                }
                                return res;
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

                let route = req.route.toString().replace(/\..*$/, ''),
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
                            return page
                                .canSee(req.user ? req.user.id : null)
                                .then((canSee) => {
                                    if (!canSee) {
                                        return res.error403(req);
                                    }
                                    if (req.__resFormat === 'yaml') {
                                        return page.toYAML()
                                            .then((yaml) => {
                                                return res.yaml(yaml);
                                            });
                                    }

                                    return PageController.print(page, fullPath, res, req);
                                });
                        }
                        next();
                    }, (error) => {
                        console.error(error);
                        next(error);
                    });
            }
        }

        return PageController;
    });
