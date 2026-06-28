-- Create religious_order reference table
CREATE TABLE "religious_order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(300) NOT NULL,
    "abbreviation" VARCHAR(50) NOT NULL,
    "common_name" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "religious_order_pkey" PRIMARY KEY ("id")
);

-- Add FK column to person
ALTER TABLE "person" ADD COLUMN "religious_order_id" UUID REFERENCES "religious_order"("id");

-- Drop the old text column (zero existing values, so no data migration needed)
ALTER TABLE "person" DROP COLUMN "religious_order";
