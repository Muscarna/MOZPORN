CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTIONED');

ALTER TABLE "Content"
ADD COLUMN "mediaType" "MediaType",
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "sizeBytes" BIGINT,
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedBy" TEXT;

CREATE TABLE "ContentReport" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentReport_reporterId_contentId_key" ON "ContentReport"("reporterId", "contentId");
CREATE INDEX "ContentReport_contentId_idx" ON "ContentReport"("contentId");
CREATE INDEX "ContentReport_status_idx" ON "ContentReport"("status");
CREATE INDEX "ContentReport_createdAt_idx" ON "ContentReport"("createdAt");

ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_contentId_fkey"
FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
