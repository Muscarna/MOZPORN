CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
ALTER TABLE "User" ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "suspendedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "suspensionReason" TEXT;
CREATE INDEX "User_status_idx" ON "User"("status");
