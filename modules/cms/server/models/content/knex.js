/* eslint no-underscore-dangle:0 */
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

const
    SUtils = require(LACKEY_PATH).utils;

module.exports = SUtils
    .deps(
        require(LACKEY_PATH).datasources.get('knex', 'default'),
        require(LACKEY_PATH).configuration()
    )
    .promised((knex, config) => {
        return Promise
            .resolve()
            .then(() => {
                if (!config.get('datasources.pg.default.truncate')) return null;
                return knex
                    .raw('DROP TABLE IF EXISTS content CASCADE')
                    .then(() => {
                        knex.raw('DROP TABLE IF EXISTS contentToTaxonomy CASCADE');
                    });
            })
            .then(() => {
                return knex.schema.hasTable('content');
            })
            .then((exists) => {
                if (exists) return Promise.resolve();
                return knex.schema.createTableIfNotExists('content', (table) => {
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
                return knex.schema.hasTable('contentToTaxonomy');
            }).then((exists) => {
                if (exists) return Promise.resolve();
                return knex.schema.createTableIfNotExists('contentToTaxonomy', (table) => {
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

            });
    });
