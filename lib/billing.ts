import { db } from "@/lib/db";

export function money(amountMinor: number, currency = "USD") {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(amountMinor / 100);
}

export async function hasPremiumAccess(userId: string) {
  const now = new Date();
  return Boolean(await db.subscription.findFirst({
    where: {
      subscriberId: userId,
      type: "PLATFORM_PREMIUM",
      status: "ACTIVE",
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
    },
    select: { id: true },
  }));
}

export async function hasCreatorSubscription(userId: string, creatorId: string) {
  const now = new Date();
  return Boolean(await db.subscription.findFirst({
    where: {
      subscriberId: userId,
      creatorId,
      type: "CREATOR",
      status: "ACTIVE",
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
    },
    select: { id: true },
  }));
}
