CREATE TYPE "SubscriptionType" AS ENUM ('PLATFORM_PREMIUM', 'CREATOR');
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
CREATE TYPE "PaymentProvider" AS ENUM ('CCBILL', 'MANUAL');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CHARGEBACK');
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'AVAILABLE', 'PAID', 'REVERSED');

CREATE TABLE "Plan" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "SubscriptionType" NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "billingDays" INTEGER NOT NULL DEFAULT 30,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "subscriberId" TEXT NOT NULL,
  "creatorId" TEXT,
  "planId" TEXT NOT NULL,
  "type" "SubscriptionType" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
  "provider" "PaymentProvider" NOT NULL DEFAULT 'CCBILL',
  "providerRef" TEXT,
  "checkoutReference" TEXT NOT NULL,
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "provider" "PaymentProvider" NOT NULL,
  "providerRef" TEXT,
  "eventRef" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "paidAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "rawEvent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreatorEarning" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "grossAmountMinor" INTEGER NOT NULL,
  "platformFeeMinor" INTEGER NOT NULL,
  "netAmountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
  "availableAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorEarning_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");
CREATE INDEX "Plan_type_idx" ON "Plan"("type");
CREATE INDEX "Plan_active_idx" ON "Plan"("active");
CREATE UNIQUE INDEX "Subscription_providerRef_key" ON "Subscription"("providerRef");
CREATE UNIQUE INDEX "Subscription_checkoutReference_key" ON "Subscription"("checkoutReference");
CREATE INDEX "Subscription_subscriberId_status_idx" ON "Subscription"("subscriberId", "status");
CREATE INDEX "Subscription_creatorId_status_idx" ON "Subscription"("creatorId", "status");
CREATE INDEX "Subscription_type_status_idx" ON "Subscription"("type", "status");
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");
CREATE UNIQUE INDEX "Payment_eventRef_key" ON "Payment"("eventRef");
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE UNIQUE INDEX "CreatorEarning_paymentId_key" ON "CreatorEarning"("paymentId");
CREATE INDEX "CreatorEarning_creatorId_status_idx" ON "CreatorEarning"("creatorId", "status");
CREATE INDEX "CreatorEarning_createdAt_idx" ON "CreatorEarning"("createdAt");

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CreatorEarning" ADD CONSTRAINT "CreatorEarning_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorEarning" ADD CONSTRAINT "CreatorEarning_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Plan" ("id", "code", "name", "description", "type", "amountMinor", "currency", "billingDays", "active", "createdAt", "updatedAt") VALUES
('plan_premium_monthly', 'PREMIUM_MONTHLY', 'Premium mensal', 'Acesso ao conteúdo Premium da plataforma.', 'PLATFORM_PREMIUM', 999, 'USD', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('plan_creator_monthly', 'CREATOR_MONTHLY', 'Assinatura de criador', 'Acesso ao conteúdo exclusivo de um criador.', 'CREATOR', 499, 'USD', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
