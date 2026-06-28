-- CreateTable
CREATE TABLE "rite" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,

    CONSTRAINT "rite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "iso_code" VARCHAR(3) NOT NULL,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person" (
    "id" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "suffix" VARCHAR(20),
    "religious_order" VARCHAR(20),
    "date_of_birth" DATE,
    "place_of_birth" VARCHAR(200),
    "country_of_birth_id" TEXT,
    "date_of_death" DATE,
    "rite_id" TEXT NOT NULL,
    "seminary" VARCHAR(200),
    "education_notes" VARCHAR(500),
    "portrait_url" VARCHAR(500),
    "catholic_hierarchy_id" VARCHAR(50),
    "gcatholic_id" VARCHAR(50),
    "wikipedia_url" VARCHAR(500),
    "diocesan_bio_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "see" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "see_type" VARCHAR(50) NOT NULL,
    "name_prefix_override" VARCHAR(100),
    "rite_id" TEXT NOT NULL,
    "country_id" TEXT,
    "state_region" VARCHAR(100),
    "metropolitan_see_id" TEXT,
    "is_metropolitan" BOOLEAN NOT NULL DEFAULT false,
    "date_erected" DATE,
    "date_suppressed" DATE,
    "cathedral_name" VARCHAR(200),
    "cathedral_address" VARCHAR(300),
    "cathedral_latitude" DECIMAL(9,6),
    "cathedral_longitude" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "see_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "see_name_history" (
    "id" TEXT NOT NULL,
    "see_id" TEXT NOT NULL,
    "former_name" VARCHAR(200) NOT NULL,
    "start_date" DATE,
    "end_date" DATE,

    CONSTRAINT "see_name_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "see_id" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "title_override" VARCHAR(200),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "start_reason" VARCHAR(50) NOT NULL,
    "end_reason" VARCHAR(50),
    "is_current" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episcopal_consecration" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "location" VARCHAR(200),
    "principal_consecrator_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episcopal_consecration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episcopal_consecration_co_consecrator" (
    "id" TEXT NOT NULL,
    "consecration_id" TEXT NOT NULL,
    "co_consecrator_id" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,

    CONSTRAINT "episcopal_consecration_co_consecrator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "priesthood_ordination" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "location" VARCHAR(200),
    "ordaining_bishop_id" TEXT,
    "diocese_of_incardination_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "priesthood_ordination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardinalate" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "date_created" DATE NOT NULL,
    "cardinal_order" VARCHAR(20) NOT NULL,
    "titular_church" VARCHAR(200),
    "is_elector" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cardinalate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diocese_county" (
    "id" TEXT NOT NULL,
    "see_id" TEXT NOT NULL,
    "county_fips" VARCHAR(5) NOT NULL,
    "state_fips" VARCHAR(2) NOT NULL,
    "county_name" VARCHAR(100) NOT NULL,
    "state_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "diocese_county_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_citation" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "source_type" VARCHAR(50) NOT NULL,
    "source_detail" TEXT NOT NULL,
    "accessed_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_citation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_person_last_name" ON "person"("last_name");

-- CreateIndex
CREATE INDEX "idx_person_rite" ON "person"("rite_id");

-- CreateIndex
CREATE INDEX "idx_see_metropolitan" ON "see"("metropolitan_see_id");

-- CreateIndex
CREATE INDEX "idx_see_country" ON "see"("country_id");

-- CreateIndex
CREATE INDEX "idx_assignment_person" ON "assignment"("person_id");

-- CreateIndex
CREATE INDEX "idx_assignment_see" ON "assignment"("see_id");

-- CreateIndex
CREATE INDEX "idx_assignment_current" ON "assignment"("is_current");

-- CreateIndex
CREATE INDEX "idx_consecration_person" ON "episcopal_consecration"("person_id");

-- CreateIndex
CREATE INDEX "idx_consecration_principal" ON "episcopal_consecration"("principal_consecrator_id");

-- CreateIndex
CREATE UNIQUE INDEX "priesthood_ordination_person_id_key" ON "priesthood_ordination"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "cardinalate_person_id_key" ON "cardinalate"("person_id");

-- CreateIndex
CREATE INDEX "idx_diocese_county_see" ON "diocese_county"("see_id");

-- CreateIndex
CREATE INDEX "idx_diocese_county_fips" ON "diocese_county"("county_fips");

-- CreateIndex
CREATE INDEX "idx_source_citation_entity" ON "source_citation"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_country_of_birth_id_fkey" FOREIGN KEY ("country_of_birth_id") REFERENCES "country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_rite_id_fkey" FOREIGN KEY ("rite_id") REFERENCES "rite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "see" ADD CONSTRAINT "see_rite_id_fkey" FOREIGN KEY ("rite_id") REFERENCES "rite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "see" ADD CONSTRAINT "see_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "see" ADD CONSTRAINT "see_metropolitan_see_id_fkey" FOREIGN KEY ("metropolitan_see_id") REFERENCES "see"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "see_name_history" ADD CONSTRAINT "see_name_history_see_id_fkey" FOREIGN KEY ("see_id") REFERENCES "see"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_see_id_fkey" FOREIGN KEY ("see_id") REFERENCES "see"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episcopal_consecration" ADD CONSTRAINT "episcopal_consecration_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episcopal_consecration" ADD CONSTRAINT "episcopal_consecration_principal_consecrator_id_fkey" FOREIGN KEY ("principal_consecrator_id") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episcopal_consecration_co_consecrator" ADD CONSTRAINT "episcopal_consecration_co_consecrator_consecration_id_fkey" FOREIGN KEY ("consecration_id") REFERENCES "episcopal_consecration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episcopal_consecration_co_consecrator" ADD CONSTRAINT "episcopal_consecration_co_consecrator_co_consecrator_id_fkey" FOREIGN KEY ("co_consecrator_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priesthood_ordination" ADD CONSTRAINT "priesthood_ordination_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priesthood_ordination" ADD CONSTRAINT "priesthood_ordination_ordaining_bishop_id_fkey" FOREIGN KEY ("ordaining_bishop_id") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priesthood_ordination" ADD CONSTRAINT "priesthood_ordination_diocese_of_incardination_id_fkey" FOREIGN KEY ("diocese_of_incardination_id") REFERENCES "see"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardinalate" ADD CONSTRAINT "cardinalate_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diocese_county" ADD CONSTRAINT "diocese_county_see_id_fkey" FOREIGN KEY ("see_id") REFERENCES "see"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
