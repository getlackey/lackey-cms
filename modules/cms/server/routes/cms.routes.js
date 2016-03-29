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
const SUtils = require(LACKEY_PATH).utils;

function cmsResourceRoutes(server, name, param, controller) {
    server.route('/cms/' + name).get(server.aclAdmin, controller.method('table'));

    server.crud('/api/cms/' + name, param, [server.acl], {
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
        .deps(require('../controllers'),
            require('../controllers/content'),
            require('../controllers/taxonomy'),
            require('../controllers/taxonomy-type'),
            require('../controllers/media'),
            require('../controllers/language')
        )
        .promised((
            CMSController,
            ContentController,
            TaxonomyController,
            TaxonomyTypeController,
            MediaController,
            languageController) => {

            server.route('/admin*')
                .get(server.aclAdmin, CMSController.iframe);
            server.route('/cms').get(server.aclAdmin, CMSController.dashboard);
            server.route('/cms/activity')
                .get(server.aclAdmin, CMSController.activityStream);

            cmsResourceRoutes(server, 'content', 'content', ContentController);
            server.route('/cms/content/:content_id')
                .get(server.aclAdmin, ContentController.cmsEdit);

            server.route('/api/cms/content/:content_id/taxonomy')
                .post(server.aclAdmin, ContentController.method('addTaxonomy'))
                .delete(server.aclAdmin, ContentController.method('removeTaxonomy'));

            cmsResourceRoutes(server, 'taxonomy', 'taxonomy', TaxonomyController);
            cmsResourceRoutes(server, 'taxonomy-type', 'taxonomyType', TaxonomyTypeController);
            cmsResourceRoutes(server, 'media', 'media', MediaController);
            cmsResourceRoutes(server, 'language', 'language', languageController);

        });
};
