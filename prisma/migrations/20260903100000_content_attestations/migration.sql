CREATE TABLE "ContentAttestation" (
  "id" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "uploaderAdult" BOOLEAN NOT NULL,
  "allParticipantsAdults" BOOLEAN NOT NULL,
  "consentObtained" BOOLEAN NOT NULL,
  "distributionRights" BOOLEAN NOT NULL,
  "declarationVersion" TEXT NOT NULL DEFAULT '2026-09',
  "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentAttestation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentAttestation_contentId_key" ON "ContentAttestation"("contentId");
CREATE INDEX "ContentAttestation_creatorId_idx" ON "ContentAttestation"("creatorId");
CREATE INDEX "ContentAttestation_declaredAt_idx" ON "ContentAttestation"("declaredAt");
ALTER TABLE "ContentAttestation" ADD CONSTRAINT "ContentAttestation_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
