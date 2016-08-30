CREATE OR REPLACE FUNCTION public."MediaACL" (
    "inUserId" bigint,
    "inMediaId" bigint)
  RETURNS boolean AS

$BODY$

DECLARE
    "mediaTaxonomies" bigint[];
    "userTaxonomies" bigint[];
    "mediaTaxonomyTypes" bigint[];
    "loopTypeId" bigint;
BEGIN

    /* COLLECT Media restrictive taxonomies */
    "mediaTaxonomies" := array(
        SELECT
            DISTINCT "taxonomyId"
            FROM (
                SELECT
                    "taxonomyId"
                FROM "mediaToTaxonomy" AS ctt
                WHERE
                    ctt."mediaId" = "inMediaId"
            ) AS FOO
            JOIN
                "taxonomy" t
                    ON FOO."taxonomyId" = t."id"
            JOIN
            "taxonomyType" tt
                ON tt."id" = t."taxonomyTypeId"
                AND tt.restrictive = true
    );

    "mediaTaxonomyTypes" := array(
        SELECT
            DISTINCT "taxonomyTypeId"
            FROM "taxonomy"
            WHERE
                "id" = ANY("mediaTaxonomies")
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

    FOREACH "loopTypeId" IN ARRAY "mediaTaxonomyTypes"
        LOOP
            IF (
                SELECT
                    COUNT(*)
                    FROM "taxonomy" AS t
                    WHERE
                        t.id = ANY("mediaTaxonomies")
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
