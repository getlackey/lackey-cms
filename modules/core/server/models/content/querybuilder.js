/* eslint no-underscore-dangle:0 */
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

const
    SCli = require(LACKEY_PATH).cli,
    INCLUDE_QUERY = `
        id IN (
            SELECT id FROM content AS con WHERE $1
       )`,
    INCLUDE_QUERY_MEDIA = `
        id IN (
            SELECT id FROM media AS con WHERE $1
       )`,
    INCLUDE_SUB = `
        (
            SELECT count(*) FROM (
                SELECT ttt."taxonomyId" FROM "content" AS c
                    JOIN "templateToTaxonomy" AS ttt
                        ON ttt."templateId" = c."templateId"
                        AND c.id = con.id
                UNION
                SELECT ctt."taxonomyId" FROM "contentToTaxonomy" AS ctt
                    WHERE ctt."contentId" = con.id
                ) AS FOO
         WHERE "taxonomyId" IN ($1)) > 0
    `,
    INCLUDE_SUB_MEDIA = `
        (
            SELECT count(*) FROM (
                SELECT ctt."taxonomyId" FROM "mediaToTaxonomy" AS ctt
                    WHERE ctt."mediaId" = con.id
                ) AS FOO
         WHERE "taxonomyId" IN ($1)) > 0
    `,
    EXCLUDE_QUERY = `
        id NOT IN (
            SELECT id FROM content WHERE "templateId" IN (
                SELECT "templateId" FROM "templateToTaxonomy" where "taxonomyId" IN ($1)
            )
            UNION
            SELECT "contentId" FROM "contentToTaxonomy" WHERE "taxonomyId" IN ($1)
        )`,
    EXCLUDE_QUERY_MEDIA = `
        id NOT IN (
            SELECT "mediaId" FROM "mediaToTaxonomy" WHERE "taxonomyId" IN ($1)
        )`,
    EXCLUDE_QUERY_BUT = `
        id NOT IN (
            SELECT id FROM content WHERE "templateId" IN (
                SELECT "templateId" FROM "templateToTaxonomy" where "taxonomyId" IN ($1)
            )
            UNION
            SELECT "contentId" FROM "contentToTaxonomy" WHERE "taxonomyId" IN ($1)
            EXCEPT
            SELECT id FROM content WHERE "templateId" IN (
                SELECT "templateId" FROM "templateToTaxonomy" where "taxonomyId" IN ($2)
            )
            EXCEPT
            SELECT "contentId" FROM "contentToTaxonomy" WHERE "taxonomyId" IN ($2)
        )`,
    EXCLUDE_QUERY_BUT_MEDIA = `
        id NOT IN (
            SELECT "mediaId" FROM "mediaToTaxonomy" WHERE "taxonomyId" IN ($1)
            EXCEPT
            SELECT "mediaId" FROM "mediaToTaxonomy" WHERE "taxonomyId" IN ($2)
        )`,
    EXCLUDE_IDS_QUERY = `
            id NOT IN ($1)
        `,
    REQUIRE_AUTHOR_QUERY = `
            "authorId" IN ($1)
        `,
    RESTRICT_DATE = `
        "publishAt" <= NOW()
    `,
    TEXT_SEARCH = `
        (
            LOWER(plaintext::TEXT) like LOWER('%$1%')
            OR
            LOWER(name) like LOWER('%$1%')
            OR
            LOWER(route) like ('%$1%')
            $2
        )`,
    TAXONIMIES_FREE_TEXT_SEARCH = `
        OR
            id IN (
                SELECT c."contentId"
                    FROM "contentToTaxonomy" c
                    JOIN "taxonomy" t ON
                        t.id = c."taxonomyId"
                        AND (LOWER(t.name) LIKE LOWER('%$1%') OR LOWER(t.label) LIKE LOWER('%$1%'))
                    JOIN "taxonomyType" tt ON
                        tt.id = t."taxonomyTypeId"
                        AND tt.name = '$2'
            )
        OR
            "templateId" IN (
                SELECT c."templateId"
                    FROM "templateToTaxonomy" c
                    JOIN "taxonomy" t ON
                        t.id = c."taxonomyId"
                        AND (LOWER(t.name) LIKE LOWER('%$1%') OR LOWER(t.label) LIKE LOWER('%$1%'))
                    JOIN "taxonomyType" tt ON
                        tt.id = t."taxonomyTypeId"
                        AND tt.name = '$2'
        )`;

module.exports = require(LACKEY_PATH)
    .datasources.get('knex', 'default')
    .then((knex) => {

        class ContentQueryBuilder {

            constructor() {
                this._wheres = [];
                this._type = 'content';
            }

            type(newType) {
                this._type = newType;
            }

            withTaxonomies(taxonomies) {
                if (taxonomies && Array.isArray(taxonomies) && taxonomies.length) {

                    let output = [],
                        self = this;

                    taxonomies.forEach((group) => {
                        if (group && Array.isArray(group) && group.length) {
                            output.push((self._type === 'media' ? INCLUDE_SUB_MEDIA : INCLUDE_SUB).replace(/\$1/g, group.join(', ')));
                        }
                    });

                    if (output.length) {
                        this._wheres.push((self._type === 'media' ? INCLUDE_QUERY_MEDIA : INCLUDE_QUERY).replace(/\$1/g, output.join(' AND ')));
                    } else {
                        this._wheres.push((self._type === 'media' ? INCLUDE_QUERY_MEDIA : INCLUDE_QUERY).replace(/\$1/g, 'TRUE'));
                    }
                }
            }

            withoutTaxonomies(taxonomies, butExceptThose) {
                if (butExceptThose && butExceptThose.length) {
                    return this.whereIn((this._type === 'media' ? EXCLUDE_QUERY_BUT_MEDIA : EXCLUDE_QUERY_BUT), taxonomies, butExceptThose);
                }
                this.whereIn((this._type === 'media' ? EXCLUDE_QUERY_MEDIA : EXCLUDE_QUERY), taxonomies);
            }

            withoutIds(ids) {
                if (!ids) {
                    return;
                }
                this.whereIn(EXCLUDE_IDS_QUERY, (Array.isArray(ids) ? ids : [ids]));
            }

            withAuthor(ids) {
                if (!ids) {
                    return;
                }
                this.whereIn(REQUIRE_AUTHOR_QUERY, (Array.isArray(ids) ? ids : [ids]).map((object) => object.id ? object.id : object));
            }

            whereIn(template, values, values2) {
                let q;
                if (values && Array.isArray(values) && values.length) {
                    q = template.replace(/\$1/g, values.join(', '));
                }
                if (values2 && Array.isArray(values2) && values2.length) {
                    if (!q) {
                        q = template.replace(/\$1/g, [0].join(', '));
                    }
                    q = q.replace(/\$2/g, values2.join(', '));
                }
                if (q) {
                    this._wheres.push(q);
                }
            }

            restrictDate() {
                this._wheres.push(RESTRICT_DATE);
            }

            withId(id) {
                this._wheres.push('"id" = ' + id);
            }

            excludeDrafts() {
                this._wheres.push('state = \'published\'');
            }

            withTextSearch(text, freeTextTax) {

                let
                    taxes = '',
                    value = text.replace(/[^a-zA-Z0-9\s+-]/g, '');

                if (freeTextTax && freeTextTax.length) {
                    freeTextTax
                        .forEach(tax => {
                            taxes += TAXONIMIES_FREE_TEXT_SEARCH.replace(/\$1/g, value).replace(/\$2/g, tax);
                        });
                }

                this._wheres.push(TEXT_SEARCH.replace(/\$1/g, value).replace('$2', taxes));
            }

            /**
             * [[Description]]
             * @param   {object}   user  [[Description]]
             * @param   {[[Type]]} page  [[Description]]
             * @param   {[[Type]]} limit [[Description]]
             * @param   {[[Type]]} order [[Description]]
             * @returns {object}   [[Description]]
             */
            run(user, page, limit) {

                let self = this,
                    num_limit = limit || 10;

                let countQuery = 'SELECT count(*) as "count" FROM ' + self._type,
                    query = 'SELECT ' + (self._type === 'media' ? 'source' : 'route') + ' FROM  ' + self._type;

                if (self._type === 'media') {
                    self._wheres.push('public."MediaACL"(' + (user && user.id ? user.id : 0) + '::bigint, id::bigint)');
                } else {
                    self._wheres.push('public."ContentACL"(' + (user && user.id ? user.id : 0) + '::bigint, id::bigint)');
                }

                query += ' WHERE ' + self._wheres.join(' AND ');
                countQuery += ' WHERE ' + self._wheres.join(' AND ');

                query += ' ORDER BY "createdAt" DESC ';

                if (page > 0) {
                    query += ' OFFSET ' + page * num_limit + ' ';
                }

                query += ' LIMIT ' + num_limit;

                return Promise
                    .all([
                            SCli.sql(knex.raw(countQuery)).then((r) => r.rows),
                            SCli.sql(knex.raw(query)).then((r) => r.rows)
                        ])
                    .then((results) => {

                        let count = +results[0][0].count;

                        return {
                            rows: results[1].map((r) => {
                                return r.route;
                            }),
                            paging: {
                                count: count,
                                page: +page,
                                limit: num_limit,
                                pages: Math.ceil(count / num_limit),
                                pageFormatted: 1 + (+page)
                            }
                        };
                    });
            }


        }
        return ContentQueryBuilder;
    });
