/* eslint no-underscore-dangle:0 */
/* jslint node:true, esnext:true */
/* global LACKEY_PATH */
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

const Schema = require('./schema'),
    SCli = require(LACKEY_PATH).cli,
    __MODULE_NAME = 'lackey-cms/modules/core/server/models/knex';

SCli.debug(__MODULE_NAME, 'Knex required');

module.exports = Schema
    .whenReady
    .then((knex) => {

        SCli.debug(__MODULE_NAME, 'Knex initted');

        return Schema
            //
            // TABLE Users
            //
            .table(knex, 'users', (table) => {
                table.increments();
                table.string('name');
                table.string('title');
                table.string('slug');
                table.string('hashedPassword');
                table.string('salt');
                table.bigInteger('avatar');
                table.string('bio');
                table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
            })
            .then(() => {
                return Schema.addColumn(knex, 'users', 'route', (table) => {
                    table.string('route');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'users', 'deleted', (table) => {
                    table.boolean('deleted');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'users', 'lastActive', (table) => {
                    table.timestamp('lastActive');
                });
            })
            //
            // TABLE identities
            // .userId -> users.id
            //
            .then(() => {
                return Schema.table(knex, 'identities', (table) => {
                    table.increments();
                    table.string('provider');
                    table.string('accountId');
                    table.string('accessToken');
                    table.string('refreshToken');
                    table.json('providerData');
                    table.boolean('confirmed');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                    table.unique(['provider', 'accountId']);
                });
            })
            //
            // TABLE sessions
            //
            //
            .then(() => {
                return Schema.table(knex, 'sessions', (table) => {
                    table.string('sid');
                    table.json('sess').notNullable();
                    table.unique(['sid']);
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'sessions', 'userId', (table) => {
                    table.bigInteger('userId');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'sessions', 'device', (table) => {
                    table.string('device');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'sessions', 'ipAddress', (table) => {
                    table.string('ipAddress');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'sessions', 'userAgent', (table) => {
                    table.string('userAgent');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'sessions', 'browser', (table) => {
                    table.string('browser');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'sessions', 'os', (table) => {
                    table.string('os');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'sessions', 'updated', (table) => {
                    table.timestamp('updated').notNullable().defaultTo(knex.raw('now()'));
                });
            })

        //
        // TABLE roles
        //
        .then(() => {
                return Schema.table(knex, 'roles', (table) => {
                    table.increments();
                    table.string('name');
                    table.string('label');
                    table.json('acl');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                    table.unique('name');

                });
            })
            //
            // TABLE acl
            // .userId -> users.id
            // .roleId -> roles.id
            //
            .then(() => {
                return Schema.table(knex, 'acl', (table) => {
                    table.increments();
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.bigInteger('roleId')
                        .unsigned()
                        .references('id')
                        .inTable('roles')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });
            })
            //
            // TABLE tokens
            // .userId -> users.id
            //
            .then(() => {
                return Schema.table(knex, 'tokens', (table) => {
                    table.increments();
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.string('token');
                    table.string('type');
                    table.timestamp('expire');
                    table.boolean('used');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });
            })
            //
            // TABLE activityLog
            // .userId -> users.id
            //
            .then(() => {
                return Schema.table(knex, 'activityLog', (table) => {
                    table.increments();
                    table.string('method');
                    table.string('url');
                    table.json('headers');
                    table.json('body');
                    table.integer('status');
                    table.integer('duration');
                    table.json('response');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });
            })
            //
            // TABLE template
            // userId -> users.id
            //
            .then(() => {
                return Schema.table(knex, 'template', (table) => {
                    table.increments();
                    table.string('name');
                    table.string('path');
                    table.string('type');
                    table.string('thumb');
                    table.boolean('selectable');
                    table.json('props');
                    table.json('populate');
                    table.json('javascripts');
                    table.json('stylesheets');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                    table.unique('path');
                });

            })
            .then(() => {
                return Schema.addColumn(knex, 'template', 'expose', (table) => {
                    table.json('expose');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'template', 'prefix', (table) => {
                    table.string('prefix');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'template', 'variants', (table) => {
                    table.json('variants');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'template', 'require', (table) => {
                    table.json('require');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'template', 'allowTaxonomies', (table) => {
                    table.json('allowTaxonomies');
                });
            })
            //
            // TABLE content
            // .userId -> users.id
            // .templateId -> template.id
            //
            .then(() => {
                return Schema.table(knex, 'content', (table) => {
                    table.increments();
                    table.string('name');
                    table.string('type');
                    table.json('layout');
                    table.json('props');
                    table.string('route');
                    table.string('state');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.bigInteger('templateId')
                        .unsigned()
                        .references('id')
                        .inTable('template')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                    table.unique(['route', 'type']);
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'content', 'authorId', (table) => {
                    table.bigInteger('authorId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'content', 'publishAt', (table) => {
                    table.date('publishAt').notNullable().defaultTo(knex.raw('now()'));
                });
            })
            //
            // TABLE redirect
            // userId -> users.id
            //
            .then(() => {
                return Schema.table(knex, 'redirect', (table) => {
                    table.increments();
                    table.string('route');
                    table.string('target');
                    table.string('type');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                    table.unique('route');
                });
            })
            //
            // TABLE media
            // userId -> users.id
            //
            .then(() => {
                return Schema.table(knex, 'media', (table) => {
                    table.increments();
                    table.string('mime');
                    table.string('name');
                    table.string('source');
                    table.json('attributes');
                    table.json('alternatives');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });
            })
            //
            // TABLE taxonomyType
            // userId -> users.id
            //
            .then(() => {
                return Schema.table(knex, 'taxonomyType', (table) => {
                    table.increments();
                    table.string('name');
                    table.string('label');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                    table.unique('name');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'taxonomyType', 'restrictive', (table) => {
                    table.boolean('restrictive');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'taxonomyType', 'description', (table) => {
                    table.string('description');
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'taxonomyType', 'allowCreation', (table) => {
                    table.boolean('allowCreation');
                });
            })
            //
            // TABLE taxonomy
            // userId -> users.id
            // taxonomyTypeId -> taxonomyType.id
            //
            .then(() => {
                return Schema.table(knex, 'taxonomy', (table) => {
                    table.increments();
                    table.string('name');
                    table.string('label');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.bigInteger('taxonomyTypeId')
                        .unsigned()
                        .references('id')
                        .inTable('taxonomyType')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });
            })
            //
            // TABLE userToTaxonomy
            // taxonomyUserId -> taxonomy.id
            // userId -> users.id
            // taxonomyUserId -> users.id
            //
            .then(() => {
                return Schema.table(knex, 'userToTaxonomy', (table) => {
                    table.increments();
                    table.bigInteger('taxonomyUserId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.bigInteger('taxonomyId')
                        .unsigned()
                        .references('id')
                        .inTable('taxonomy')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });

            })
            //
            // TABLE roleToTaxonomy
            // taxonomyUserId -> taxonomy.id
            // userId -> users.id
            // roleId -> roles.id
            //
            .then(() => {
                return Schema.table(knex, 'roleToTaxonomy', (table) => {
                    table.increments();
                    table.bigInteger('roleId')
                        .unsigned()
                        .references('id')
                        .inTable('roles')
                        .onDelete('CASCADE');
                    table.bigInteger('taxonomyId')
                        .unsigned()
                        .references('id')
                        .inTable('taxonomy')
                        .onDelete('CASCADE');
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });

            })
            //
            // TABLE templateToTaxonomy
            // taxonomyUserId -> taxonomy.id
            // userId -> users.id
            // templateId -> templates.id
            //
            .then(() => {
                return Schema.table(knex, 'templateToTaxonomy', (table) => {
                    table.increments();
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.bigInteger('taxonomyId')
                        .unsigned()
                        .references('id')
                        .inTable('taxonomy')
                        .onDelete('CASCADE');
                    table.bigInteger('templateId')
                        .unsigned()
                        .references('id')
                        .inTable('template')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });

            })
            //
            // TABLE contentToTaxonomy
            // taxonomyUserId -> taxonomy.id
            // userId -> users.id
            // contentId -> content.id
            //
            .then(() => {
                return Schema.table(knex, 'contentToTaxonomy', (table) => {
                    table.increments();
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.bigInteger('taxonomyId')
                        .unsigned()
                        .references('id')
                        .inTable('taxonomy')
                        .onDelete('CASCADE');
                    table.bigInteger('contentId')
                        .unsigned()
                        .references('id')
                        .inTable('content')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });

            })
            .then(() => {
                return Schema.loadSQL(knex, __dirname + '/content/psql/ContentACL.sql');
            })
            //
            // TABLE mediaToTaxonomy
            // taxonomyId -> taxonomy.id
            // userId -> users.id
            // mediaId -> media.id
            //
            .then(() => {
                return Schema.table(knex, 'mediaToTaxonomy', (table) => {
                    table.increments();
                    table.bigInteger('userId')
                        .unsigned()
                        .references('id')
                        .inTable('users')
                        .onDelete('CASCADE');
                    table.bigInteger('taxonomyId')
                        .unsigned()
                        .references('id')
                        .inTable('taxonomy')
                        .onDelete('CASCADE');
                    table.bigInteger('mediaId')
                        .unsigned()
                        .references('id')
                        .inTable('media')
                        .onDelete('CASCADE');
                    table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
                    table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('now()'));
                });

            })
            .then(() => {
                return Schema.loadSQL(knex, __dirname + '/media/psql/MediaACL.sql');
            })
            //
            // TABLE Translations
            //
            //
            .then(() => {
                return Schema.table(knex, 'translations', (table) => {
                    table.increments();
                    table.string('reference');
                    table.string('originalValue');
                    table.string('language');
                    table.string('value');
                });
            })
            //
            // TABLE Translations
            //
            //
            .then(() => {
                return Schema.table(knex, 'analytics', (table) => {
                    table.increments();
                    table.string('metric').notNullable();
                    table.integer('value').defaultTo(1).notNullable();
                    table.date('date').notNullable();
                    table.unique(['metric', 'date']);
                });
            })
            .then(() => {
                return Schema.addColumn(knex, 'analytics', 'map', (table) => {
                    table.json('map');
                });
            })
            .then(() => {
                return knex.schema.raw('UPDATE taxonomy SET name = lower(name)');
            })
            .then(() => {
                SCli.debug(__MODULE_NAME, 'Schema applied');
            });
    });
