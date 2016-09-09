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

const
    SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    SCli = require(LACKEY_PATH).cli,
    Model = objection.Model,
    _ = require('lodash'),
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/activity-log';

SCli.debug(__MODULE_NAME, 'REQUIRED');

/**
 * @module lackey-cms/cms/server/models/template
 * @type {Promise<Template>}
 */
module.exports = SUtils
    .waitForAs(__MODULE_NAME,
        SUtils.cmsMod('core').model('taggable'),
        SUtils.cmsMod('core').model('taxonomy-type'),
        require('../knex')
    )
    .then((Taggable, TaxonomyType) => {

        SCli.debug(__MODULE_NAME, 'READY');

        /**
         * Table "template"
         * @class
         * @private
         */
        class TemplateModel extends Model {

            static get tableName() {
                return 'template';
            }
        }

        /**
         * Table "templateToTaxonomy"
         * @class
         * @private
         */
        class TemplateToTaxonomy extends Model {

            static get tableName() {
                return 'templateToTaxonomy';
            }
        }

        /**
         * @class
         * @public
         * @name Template
         */
        class Template extends Taggable {

            /**
             * @name Template.api
             * @static
             * @property {string}
             */
            static get api() {

                return '/cms/template';
            }


            static get model() {

                return TemplateModel;
            }

            static get taxonomyRelationModel() {

                return TemplateToTaxonomy;
            }

            static get taxonomyRelationField() {

                return 'templateId';
            }

            get path() {

                return this._doc.path;
            }

            get type() {

                return this._doc.type;
            }

            get populate() {

                return this._doc.populate || [];
            }

            get expose() {
                return this._doc.expose || [];
            }

            get prefix() {
                return this._doc.prefix || '';
            }

            get require() {
                return this._doc.require || [];
            }

            get allowTaxonomies() {
                return this._doc.allowTaxonomies || [];
            }

            get props() {

                let props = this._doc.props || {};

                if (this._doc.type !== 'block' && this._doc.type !== 'variant') {
                    props.og_title = props.og_title || {
                        label: 'Title (used in OpenGraph)',
                        name: 'og_title'
                    };
                    props.og_type = props.og_type || {
                        label: 'Type (used in OpenGraph)',
                        name: 'og_type'
                    };
                    props.og_description = props.og_description || {
                        label: 'Description (used in OpenGraph)',
                        name: 'og_description'
                    };
                    props.og_image = props.og_image || {
                        label: 'Image (used in OpenGraph)',
                        name: 'og_image',
                        type: 'media'
                    };
                }
                return props;
            }

            static selectable(user) {

                SCli.debug('lackey-cms/modules/cms/server/models/template', 'selectable', this.model.tableName);
                let Self = this;
                return SCli
                    .sql(this.model
                        .query()
                        .where('selectable', true)
                        .where('type', 'template')
                    )
                    .then(results => {
                        return Promise
                            .all(results.map(result => Self.factory(result)));
                    })
                    .then(templates => {
                        return Promise
                            .all(templates.map(template => template.canEdit(user).then(canEdit => canEdit ? template : null)));
                    })
                    .then(templates => {
                        return templates
                            .filter(template => template !== null);
                    });
            }

            canEdit(user) {
                if (this.require.length === 0) {
                    return Promise.resolve(true);
                }
                return Promise
                    .all(this.require.map(perm => user.isAllowed('templates', perm)))
                    .then(list => list.filter(result => result))
                    .then(list => list.length > 0);
            }

            diff(data) {

                let self = this;
                _.merge(self._doc, data);

                [
                    'javascripts',
                    'stylesheets',
                    'props',
                    'populate',
                    'expose',
                    'variants',
                    'require',
                    'taxonomies'
                ].forEach(key => {
                    if (data[key] !== undefined) {
                        self._doc[key] = data[key];
                    }
                });
                return true;
            }

            toJSON() {

                return {
                    id: this.id,
                    name: this._doc.name,
                    path: this._doc.path,
                    type: this._doc.type,
                    javascripts: this._doc.javascripts,
                    stylesheets: this._doc.stylesheets,
                    props: this.props,
                    selectable: this._doc.selectable || false,
                    populate: this._doc.populate || [],
                    expose: this._doc.expose || [],
                    thumb: this._doc.thumb || null,
                    prefix: this._doc.prefix || '',
                    variants: this.variants || [],
                    require: this._doc.require || [],
                    taxonomies: this.taxonomies || [],
                    allowTaxonomies: this.allowTaxonomies || []
                };
            }

            _preSave() {

                return super
                    ._preSave()
                    .then(self => {
                        if (self._doc) {

                            if (self._doc.javascripts) {
                                if (!Array.isArray(self._doc.javascripts)) {
                                    self._doc.javascripts = [self._doc.javascripts];
                                }
                                self._doc.javascripts = JSON.stringify(self._doc.javascripts);
                            }
                            if (self._doc.stylesheets) {
                                if (!Array.isArray(self._doc.stylesheets)) {
                                    self._doc.stylesheets = [self._doc.stylesheets];
                                }
                                self._doc.stylesheets = JSON.stringify(self._doc.stylesheets);
                            }
                            if (self._doc.populate) {
                                if (!Array.isArray(self._doc.populate)) {
                                    self._doc.populate = [self._doc.populate];
                                }
                                self._doc.populate = JSON.stringify(self._doc.populate);
                            }
                            if (self._doc.expose) {
                                if (!Array.isArray(self._doc.expose)) {
                                    self._doc.expose = [self._doc.expose];
                                }
                                self._doc.expose = JSON.stringify(self._doc.expose);
                            }
                            if (self._doc.variants) {
                                if (!Array.isArray(self._doc.variants)) {
                                    self._doc.variants = [self._doc.variants];
                                }
                                self._doc.variants = JSON.stringify(self._doc.variants);
                            }
                            if (self._doc.require) {
                                if (!Array.isArray(self._doc.require)) {
                                    self._doc.require = [self._doc.require];
                                }
                                self._doc.require = JSON.stringify(self._doc.require);
                            }
                            if (self._doc.allowTaxonomies) {
                                if (!Array.isArray(self._doc.allowTaxonomies)) {
                                    self._doc.allowTaxonomies = [self._doc.allowTaxonomies];
                                }
                                self._doc.allowTaxonomies = JSON.stringify(self._doc.allowTaxonomies
                                    .filter(a => !!a)
                                    .map(taxonomyType => {
                                        if (typeof taxonomyType === 'string') {
                                            return taxonomyType;
                                        }
                                        return taxonomyType.name;
                                    }));
                            }
                            if (!self._doc.type) {
                                self._doc.type = 'template';
                            }
                        }
                        return self;
                    });
            }

            static getOfType(type) {

                return SCli
                    .sql(TemplateModel
                        .query()
                        .where('type', type))
                    .then(results => {
                        return results
                            .map(result => new Template(result));
                    });
            }

            static getByPath(path) {

                return this.findOneBy('path', path);
            }

            _populate() {

                let self = this;

                return super
                    ._populate()
                    .then(() => {

                        if (typeof self._doc.javascripts === 'string') {
                            self._doc.javascripts = JSON.parse(self._doc.javascripts);
                        }
                        if (typeof self._doc.stylesheets === 'string') {
                            self._doc.stylesheets = JSON.parse(self._doc.stylesheets);
                        }
                        if (typeof self._doc.expose === 'string') {
                            self._doc.expose = JSON.parse(self._doc.expose);
                        }
                        if (typeof self._doc.require === 'string') {
                            self._doc.require = JSON.parse(self._doc.require);
                        }

                        if (Array.isArray(self._doc.variants)) {

                            let promises = self
                                ._doc
                                .variants
                                .map(variant => {
                                    return Template
                                        .getByPath(variant);

                                });

                            return Promise
                                .all(promises)
                                .then(variants => {
                                    self.variants = variants;
                                    return self;
                                });
                        }
                    })
                    .then(() => {

                        if (typeof self._doc.allowTaxonomies === 'string') {
                            self._doc.allowTaxonomies = JSON.parse(self._doc.allowTaxonomies);
                        }
                        return Promise
                            .all((self._doc.allowTaxonomies || [])
                                .map(taxonomyTypeName => TaxonomyType.getByName(taxonomyTypeName)));
                    })
                    .then(taxonomyTypes => {
                        self._doc.allowTaxonomies = taxonomyTypes;
                        return self;
                    });
            }
        }

        Template.generator = require('./generator');

        return Template;
    });
