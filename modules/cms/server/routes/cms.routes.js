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
const SUtils = require(LACKEY_PATH).utils;

function cmsResourceRoutes(server, name, param, controller) {
    server.route('/cms/' + name).get(server.aclAdmin, controller.method('table'));

    server.crud('/api/cms/' + name, param, [server.aclAdmin], {
        list: controller.method('list'),
        create: controller.method('create'),
        read: controller.method('read'),
        update: controller.method('update'),
        delete: controller.method('delete'),
        byID: controller.method('byId', true)
    });
}

module.exports = (server) => {

    return SUtils
        .waitForAs('cms routes',
            require('../controllers'),
            require('../controllers/content'),
            require('../controllers/taxonomy'),
            require('../controllers/taxonomy-type'),
            require('../controllers/media'),
            require('../controllers/language'),
            require('../controllers/activity'),
            require('../controllers/role'),
            require('../controllers/template'),
            require('../controllers/page'),
            require('../controllers/session')
        )
        .then((
            CMSController,
            ContentController,
            TaxonomyController,
            TaxonomyTypeController,
            MediaController,
            LanguageController,
            ActivityController,
            RoleController,
            TemplateController,
            PageController,
            SessionController
        ) => {

            server.route('/admin*').get(server.aclAdmin, CMSController.iframe);

            server.route('/api/view-as')
                .get(server.aclAdmin, CMSController.viewingAs);

            server.route('/cms').get(server.aclAdmin, CMSController.dashboard);
            server.route('/cms/preview').post(server.aclAdmin, PageController.preview);
            server.route('/cms/content/create')
                .get(server.aclAdmin, ContentController.createPage);

            server.route('/cms/export/all')
                .get( /*server.aclAdmin, */ CMSController.serialize);

            server.route('/api/cms/session')
                .delete(server.aclAdmin, SessionController.method('removeAll'));

            server.route('/api/cms/content/:content_id/taxonomy/:taxonomyTypeName/:taxonomyName')
                .delete(server.aclAdmin, ContentController.method('removeTaxonomy'));

            server.route('/api/cms/content/:content_id/taxonomy')
                .post(server.aclAdmin, ContentController.method('addTaxonomy'));

            server.param('taxonomyTypeName', (req, res, next, id) => {
                req.taxonomyTypeName = id;
                next();
            });

            server.param('taxonomyName', (req, res, next, id) => {
                req.taxonomyName = id;
                next();
            });

            cmsResourceRoutes(server, 'activity', 'activity', ActivityController);
            cmsResourceRoutes(server, 'content', 'content', ContentController);
            cmsResourceRoutes(server, 'taxonomy', 'taxonomy', TaxonomyController);
            cmsResourceRoutes(server, 'taxonomy-type', 'taxonomyType', TaxonomyTypeController);
            cmsResourceRoutes(server, 'media', 'media', MediaController);
            cmsResourceRoutes(server, 'language', 'language', LanguageController);
            cmsResourceRoutes(server, 'role', 'role', RoleController);
            cmsResourceRoutes(server, 'template', 'template', TemplateController);
            cmsResourceRoutes(server, 'session', 'session', SessionController);

        });
};
