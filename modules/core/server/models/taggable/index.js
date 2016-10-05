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

const SUtils = require(LACKEY_PATH).utils,
    SCli = require(LACKEY_PATH).cli,
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/taggable';

SCli.debug(__MODULE_NAME, 'REQUIRED');
/**
 * @module lackey-cms/cms/server/models/taggable
 * @type {Promise<Template>}
 */
module.exports = SUtils
    .waitForAs(__MODULE_NAME,
        SUtils.cmsMod('core').model('objection'),
        SUtils.cmsMod('core').model('taxonomy')
    )
    .then((ObjectionWrapper, Taxonomy) => {

        SCli.debug(__MODULE_NAME, 'READY');

        /**
         * @class
         * @public
         * @abstract
         * @name Taggable
         */
        class Taggable extends ObjectionWrapper {

            static get taxonomyRelationModel() {
                throw new Error('Have to be implemented');
            }

            static get taxonomyRelationField() {
                throw new Error('Have to be implemented');
            }

            /**
             * Pre save hanlder to store taxonomies
             * @returns {Promise<ObjectionWrapper>}
             */
            _preSave() {
                if (this._doc) {
                    delete this._doc.taxonomies;
                    delete this._doc.taxonomy;
                }
                return Promise.resolve(this);
            }

            __mapTaxonomyTree(types) {
                if (!types || Array.isArray(types)) {
                    return Promise.resolve(types);
                }
                let taxonomies = [];
                return Promise
                    .all(Object.keys(types).map((typeName) => {
                        return Promise
                            .all(types[typeName].map((taxonomyName) => {
                                return Taxonomy
                                    .byTypeAndName(typeName, taxonomyName)
                                    .then((taxonomy) => {
                                        taxonomies.push(taxonomy);
                                    });
                            }));
                    }))
                    .then(() => taxonomies);

            }


            addTaxonomy(taxonomy) {
                let self = this,
                    parent = this.constructor,
                    query = {

                        taxonomyId: taxonomy.id
                    };
                query[parent.taxonomyRelationField] = this.id;

                console.log(this);
                console.log(this.taxonomyRelationModel);
                console.log(this.taxonomyRelationField);


                return SCli.sql(parent.taxonomyRelationModel
                        .query()
                        .insert(query))
                    .then(() => {
                        return self._populate();
                    });
            }

            removeTaxonomy(taxonomy) {
                let self = this,
                    parent = this.constructor;
                return SCli.sql(parent.taxonomyRelationModel
                        .query()
                        .del()
                        .where(parent.taxonomyRelationField, this.id)
                        .where('taxonomyId', taxonomy.id)
                    )
                    .then(() => {
                        return self._populate();
                    });
            }

            /**
             * Post save hanlder to store taxonomies
             * @returns {Promise}
             */
            _postSave(cached) {
                let
                    self = this,
                    parent = this.constructor;

                return Promise
                    .resolve(cached.taxonomy || cached.taxonomies)
                    .then((taxonomies) => {

                        if (!taxonomies) {
                            return taxonomies;
                        }

                        return SCli.sql(parent.taxonomyRelationModel
                                .query()
                                .delete()
                                .where(parent.taxonomyRelationField, self.id))
                            .then(() => taxonomies);
                    })
                    .then((taxonomies) => {

                        return self.__mapTaxonomyTree(taxonomies);
                    })
                    .then((taxonomies) => {

                        if (!taxonomies) {
                            return self;
                        }

                        return SCli.sql(parent.taxonomyRelationModel
                                .query()
                                .insert(taxonomies.map((id) => {
                                    let query = {
                                        taxonomyId: id.id ? id.id : id
                                    };
                                    query[parent.taxonomyRelationField] = self.id;
                                    return query;
                                })))
                            .then(() => self);
                    });

            }

            /**
             * Populate decorator to load taxonomies
             * @returns {Promise<ObjectionWrapper>}
             */
            _populate() {
                let self = this,
                    parent = this.constructor;

                return SCli
                    .sql(parent.taxonomyRelationModel
                        .query()
                        .where(parent.taxonomyRelationField, self.id))
                    .then((taxonomyIds) => {
                        return Taxonomy.findByIds(taxonomyIds.map((row) => row.taxonomyId));
                    })
                    .then((taxonomies) => {
                        self.taxonomies = taxonomies;
                        return self;
                    });
            }
        }

        return Taggable;
    });
