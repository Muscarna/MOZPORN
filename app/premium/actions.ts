"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hashAccessCode, normalizeAccessCode } from "@/lib/access-codes";
import { db } from "@/lib/db";
import { markSecurityEventSuccess, rateLimitAttempt } from "@/lib/rate-limit";

export async function redeemAccessCodeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rawCode = normalizeAccessCode(String(formData.get("code") ?? ""));
  const attempt = await rateLimitAttempt("REDEEM_ACCESS_CODE", 5, 15 * 60 * 1000, user.id);
  if (!attempt.allowed) redirect("/premium?code=limited");
  if (rawCode.length < 6 || rawCode.length > 40) redirect("/premium?code=invalid");

  const result = await db.$transaction(async (tx) => {
    const now = new Date();
    const accessCode = await tx.accessCode.findUnique({ where: { codeHash: hashAccessCode(rawCode) } });
    if (!accessCode || !accessCode.active || accessCode.redemptionCount >= accessCode.maxRedemptions || accessCode.expiresAt && accessCode.expiresAt <= now) return "invalid" as const;
    if (await tx.accessCodeRedemption.findUnique({ where: { codeId_userId: { codeId: accessCode.id, userId: user.id } } })) return "used" as const;
    const plan = await tx.plan.findFirst({ where: { code: "PREMIUM_MONTHLY", active: true } });
    if (!plan) return "unavailable" as const;
    const reserved = await tx.accessCode.updateMany({ where: { id: accessCode.id, active: true, redemptionCount: { lt: accessCode.maxRedemptions }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, data: { redemptionCount: { increment: 1 } } });
    if (reserved.count !== 1) return "invalid" as const;
    const current = await tx.subscription.findFirst({ where: { subscriberId: user.id, creatorId: null, type: "PLATFORM_PREMIUM", status: { in: ["ACTIVE", "PENDING"] } }, orderBy: { currentPeriodEnd: "desc" } });
    const base = current?.currentPeriodEnd && current.currentPeriodEnd > now ? current.currentPeriodEnd : now;
    const end = new Date(base.getTime() + accessCode.durationDays * 86400000);
    const subscription = current ? await tx.subscription.update({ where: { id: current.id }, data: { planId: plan.id, provider: "MANUAL", status: "ACTIVE", currentPeriodStart: current.currentPeriodStart ?? now, currentPeriodEnd: end, canceledAt: null } }) : await tx.subscription.create({ data: { subscriberId: user.id, planId: plan.id, type: "PLATFORM_PREMIUM", provider: "MANUAL", status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: end } });
    await tx.accessCodeRedemption.create({ data: { codeId: accessCode.id, userId: user.id, subscriptionId: subscription.id } });
    return "success" as const;
  });
  if (result === "success") {
    await markSecurityEventSuccess(attempt.eventId);
    redirect("/premium?code=success");
  }
  redirect(`/premium?code=${result}`);
}
