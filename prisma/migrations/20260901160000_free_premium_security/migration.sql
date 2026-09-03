CREATE TABLE "AccessCode" (
  "id" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
  "redemptionCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessCodeRedemption" (
  "id" TEXT NOT NULL,
  "codeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessCodeRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityEvent" (
  "id" TEXT NOT NULL,
  "fingerprintHash" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "subject" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessCode_codeHash_key" ON "AccessCode"("codeHash");
CREATE INDEX "AccessCode_active_expiresAt_idx" ON "AccessCode"("active", "expiresAt");
CREATE INDEX "AccessCode_createdAt_idx" ON "AccessCode"("createdAt");
CREATE UNIQUE INDEX "AccessCodeRedemption_codeId_userId_key" ON "AccessCodeRedemption"("codeId", "userId");
CREATE INDEX "AccessCodeRedemption_userId_idx" ON "AccessCodeRedemption"("userId");
CREATE INDEX "AccessCodeRedemption_subscriptionId_idx" ON "AccessCodeRedemption"("subscriptionId");
CREATE INDEX "SecurityEvent_fingerprintHash_action_createdAt_idx" ON "SecurityEvent"("fingerprintHash", "action", "createdAt");
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

ALTER TABLE "AccessCodeRedemption" ADD CONSTRAINT "AccessCodeRedemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "AccessCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessCodeRedemption" ADD CONSTRAINT "AccessCodeRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessCodeRedemption" ADD CONSTRAINT "AccessCodeRedemption_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
