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
        require(LACKEY_PATH).datasources.get('knex', 'default')
    )
    .promised((knex) => {
        return knex.schema.hasTable('activityLog')
            .then((exists) => {
                if (exists) return Promise.resolve();
                return knex.schema.createTableIfNotExists('activityLog', (table) => {
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

            });
    });
