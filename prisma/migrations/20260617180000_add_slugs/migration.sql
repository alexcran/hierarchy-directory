-- Add nullable slug columns
ALTER TABLE "person" ADD COLUMN "slug" VARCHAR(200);
ALTER TABLE "see"    ADD COLUMN "slug" VARCHAR(200);

-- Backfill person slugs: first_name + middle_initial + last_name, lowercased
-- Duplicates get a numeric suffix (-2, -3, …)
WITH base AS (
  SELECT
    id,
    trim('-' FROM regexp_replace(
      lower(concat_ws(' ',
        first_name,
        CASE WHEN middle_name IS NOT NULL AND length(trim(middle_name)) > 0
          THEN left(trim(middle_name), 1)
          ELSE NULL
        END,
        last_name
      )),
      '[^a-z0-9]+', '-', 'g'
    )) AS base_slug
  FROM person
),
ranked AS (
  SELECT id, base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn
  FROM base
)
UPDATE person p
SET slug = CASE WHEN r.rn = 1 THEN r.base_slug
                ELSE r.base_slug || '-' || r.rn::text
           END
FROM ranked r
WHERE p.id = r.id;

-- Make person slug NOT NULL and unique
ALTER TABLE "person" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "person_slug_key" ON "person"("slug");

-- Backfill see slugs: from the see name only (not the seeType prefix)
WITH base AS (
  SELECT
    id,
    trim('-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) AS base_slug
  FROM see
),
ranked AS (
  SELECT id, base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn
  FROM base
)
UPDATE see s
SET slug = CASE WHEN r.rn = 1 THEN r.base_slug
                ELSE r.base_slug || '-' || r.rn::text
           END
FROM ranked r
WHERE s.id = r.id;

-- Make see slug NOT NULL and unique
ALTER TABLE "see" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "see_slug_key" ON "see"("slug");
