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

const
    SUtils = require(LACKEY_PATH).utils,
    SCli = require(LACKEY_PATH).cli,
    __MODULE_NAME = 'lackey-cms/modules/core/modeks/schema';

let ready = SUtils
    .waitForAs(
        __MODULE_NAME,
        require(LACKEY_PATH).datasources.get('knex', 'default')
    )
    .then((knex) => {
        SCli.debug(__MODULE_NAME, 'KNEX READY FOR SCHEMA');
        return knex;
    }); // must rewrite to map to promise

class Schema {

    static get whenReady() {
        return ready;
    }

    static table(knex, tableName, createFunction) {
        SCli.debug(__MODULE_NAME, 'Create table ' + tableName);
        return knex.schema
            .hasTable(tableName)
            .then((exists) => {
                if (!exists) {
                    return knex
                        .schema
                        .createTableIfNotExists(tableName, createFunction);
                }
            })
            .then(() => {
                SCli.debug(__MODULE_NAME, 'Created table ' + tableName);
            });
    }

    static addColumn(knex, tableName, columnName, createFunciton) {
        SCli.debug(__MODULE_NAME, 'Add column ' + columnName + ' to the table ' + tableName);
        return knex.schema
            .hasColumn(tableName, columnName)
            .then((exists) => {
                if (!exists) {
                    return knex.schema.table(tableName, createFunciton);
                }
                return true;
            })
            .then(() => {
                SCli.debug(__MODULE_NAME, 'Added column ' + columnName + ' to the table ' + tableName);
            });
    }
}

module.exports = Schema;
