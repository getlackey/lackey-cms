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
                    .raw('DROP TABLE IF EXISTS users CASCADE')
                    .then(() => {
                        return knex
                            .raw('DROP TABLE IF EXISTS identities CASCADE');
                    }).then(() => {
                        return knex
                            .raw('DROP TABLE IF EXISTS acl CASCADE');
                    });
            })
            .then(() => {
                return knex.schema.hasTable('users');
            }).then((exists) => {
                if (exists) return Promise.resolve();
                return knex.schema.createTable('users', function (table) {
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
                });

            }).then(() => {
                return knex.schema.hasTable('identities');
            }).then((exists) => {
                if (exists) return Promise.resolve();
                return knex.schema.createTableIfNotExists('identities', (table) => {
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

            }).then(() => {
                return knex.schema.hasTable('acl');
            }).then((exists) => {
                if (exists) return Promise.resolve();
                return knex.schema.createTableIfNotExists('acl', (table) => {
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
            }).then(() => {
                return knex.schema.hasTable('tokens');
            }).then((exists) => {
                if (exists) return Promise.resolve();
                return knex.schema.createTableIfNotExists('tokens', (table) => {
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
            });
    });
