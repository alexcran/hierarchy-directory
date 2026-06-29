-- CreateTable
CREATE TABLE "site_setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_setting_pkey" PRIMARY KEY ("key")
);

-- SeedData
INSERT INTO "site_setting" ("key", "value", "updated_at")
VALUES (
    'noticeBar',
    '{"enabled":true,"message":"Still in beta — data is being thoroughly audited and verified","color":"#7A1B2E"}'::jsonb,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
