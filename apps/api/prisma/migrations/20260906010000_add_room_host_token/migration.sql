-- AlterTable
ALTER TABLE "Room" ADD COLUMN "hostToken" TEXT;

-- Backfill existing rows with a random token
UPDATE "Room" SET "hostToken" = gen_random_uuid()::text WHERE "hostToken" IS NULL;

ALTER TABLE "Room" ALTER COLUMN "hostToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Room_hostToken_key" ON "Room"("hostToken");
