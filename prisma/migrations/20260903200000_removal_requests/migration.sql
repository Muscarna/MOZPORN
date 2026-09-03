CREATE TYPE "RemovalRequestStatus" AS ENUM ('OPEN', 'REVIEWING', 'ACTIONED', 'REJECTED');
CREATE TYPE "RemovalRequestReason" AS ENUM ('POSSIBLE_MINOR', 'NON_CONSENSUAL', 'RIGHTS_VIOLATION', 'IMPERSONATION', 'OTHER_ILLEGAL');
CREATE TABLE "RemovalRequest" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "contentId" TEXT,
  "contentRef" TEXT NOT NULL,
  "requesterName" TEXT NOT NULL,
  "requesterEmail" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "reason" "RemovalRequestReason" NOT NULL,
  "details" TEXT NOT NULL,
  "goodFaith" BOOLEAN NOT NULL,
  "status" "RemovalRequestStatus" NOT NULL DEFAULT 'OPEN',
  "adminNotes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RemovalRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RemovalRequest_reference_key" ON "RemovalRequest"("reference");
CREATE INDEX "RemovalRequest_status_createdAt_idx" ON "RemovalRequest"("status", "createdAt");
CREATE INDEX "RemovalRequest_contentId_idx" ON "RemovalRequest"("contentId");
CREATE INDEX "RemovalRequest_requesterEmail_idx" ON "RemovalRequest"("requesterEmail");
ALTER TABLE "RemovalRequest" ADD CONSTRAINT "RemovalRequest_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
