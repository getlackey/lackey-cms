CREATE OR REPLACE FUNCTION public."ContentACL" (
    "inUserId" bigint,
    "inContentId" bigint)
  RETURNS boolean AS

$BODY$

DECLARE
    "contentTaxonomies" bigint[];
    "userTaxonomies" bigint[];
    "contentTaxonomyTypes" bigint[];
    "loopTypeId" bigint;
BEGIN

    /* COLLECT Content restrictive taxonomies */
    "contentTaxonomies" := array(
        SELECT
            DISTINCT "taxonomyId"
            FROM (
                SELECT
                    "taxonomyId"
                FROM "contentToTaxonomy" AS ctt
                WHERE
                    ctt."contentId" = "inContentId"
                UNION
                SELECT
                    "taxonomyId"
                FROM "templateToTaxonomy" AS ttt
                JOIN
                    "content" c
                        ON c."templateId" = ttt."templateId"
                        AND c."id" = "inContentId"
            ) AS FOO
            JOIN
                "taxonomy" t
                    ON FOO."taxonomyId" = t."id"
            JOIN
            "taxonomyType" tt
                ON tt."id" = t."taxonomyTypeId"
                AND tt.restrictive = true
    );

    "contentTaxonomyTypes" := array(
        SELECT
            DISTINCT "taxonomyTypeId"
            FROM "taxonomy"
            WHERE
                "id" = ANY("contentTaxonomies")
    );

    "userTaxonomies" := array(
        SELECT
            DISTINCT "taxonomyId"
            FROM (
                    SELECT "taxonomyId"
                        FROM "userToTaxonomy" AS utt
                        WHERE
                            utt."taxonomyUserId" = "inUserId"
                    UNION
                    SELECT "taxonomyId"
                        FROM "roleToTaxonomy" AS rtt
                        JOIN "acl" a
                            ON a."roleId" = rtt."roleId"
                            AND a."userId" = "inUserId"
            ) AS FOO
            JOIN
                "taxonomy" t
                    ON FOO."taxonomyId" = t."id"
            JOIN
                "taxonomyType" tt
                    ON tt."id" = t."taxonomyTypeId"
                    AND tt.restrictive = true
    );

    FOREACH "loopTypeId" IN ARRAY "contentTaxonomyTypes"
        LOOP
            IF (
                SELECT
                    COUNT(*)
                    FROM "taxonomy" AS t
                    WHERE
                        t.id = ANY("contentTaxonomies")
                        AND t.id = ANY("userTaxonomies")
                        AND t."taxonomyTypeId" = "loopTypeId"
            ) = 0 THEN
                RETURN false;
            END IF;
        END LOOP;

    RETURN true;
END;

$BODY$

LANGUAGE plpgsql VOLATILE
  COST 100;
