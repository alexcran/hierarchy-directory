-- Person: wikidataId (unique), viafId, photoLicense
ALTER TABLE "person" ADD COLUMN "wikidata_id" VARCHAR(20);
ALTER TABLE "person" ADD COLUMN "viaf_id" VARCHAR(30);
ALTER TABLE "person" ADD COLUMN "photo_license" VARCHAR(100);
CREATE UNIQUE INDEX "person_wikidata_id_key" ON "person"("wikidata_id");

-- See: wikidataId (unique)
ALTER TABLE "see" ADD COLUMN "wikidata_id" VARCHAR(20);
CREATE UNIQUE INDEX "see_wikidata_id_key" ON "see"("wikidata_id");

-- Assignment: appointingPope
ALTER TABLE "assignment" ADD COLUMN "appointing_pope" VARCHAR(50);
