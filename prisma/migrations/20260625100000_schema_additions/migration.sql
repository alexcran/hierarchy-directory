-- AlterTable person: add motto
ALTER TABLE "person" ADD COLUMN "motto" VARCHAR(500);

-- AlterTable see: add latin_name
ALTER TABLE "see" ADD COLUMN "latin_name" VARCHAR(300);

-- AlterTable assignment: add installed_date
ALTER TABLE "assignment" ADD COLUMN "installed_date" DATE;

-- CreateTable vatican_event
CREATE TABLE "vatican_event" (
    "id"             TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "person_id"      TEXT         NOT NULL,
    "event_type"     VARCHAR(50)  NOT NULL,
    "event_date"     DATE         NOT NULL,
    "event_end_date" DATE,
    "description"    VARCHAR(500),
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vatican_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_vatican_event_person" ON "vatican_event"("person_id");

ALTER TABLE "vatican_event" ADD CONSTRAINT "vatican_event_person_id_fkey"
    FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable diocese_statistics
CREATE TABLE "diocese_statistics" (
    "id"                  TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "see_id"              TEXT         NOT NULL,
    "year"                INTEGER      NOT NULL,
    "catholic_population" INTEGER,
    "total_population"    INTEGER,
    "num_parishes"        INTEGER,
    "num_priests"         INTEGER,
    "num_deacons"         INTEGER,
    "num_religious"       INTEGER,
    "source"              VARCHAR(300),
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diocese_statistics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_diocese_statistics_see_year" ON "diocese_statistics"("see_id", "year");

ALTER TABLE "diocese_statistics" ADD CONSTRAINT "diocese_statistics_see_id_fkey"
    FOREIGN KEY ("see_id") REFERENCES "see"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
