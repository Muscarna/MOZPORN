"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashAccessCode, normalizeAccessCode } from "@/lib/access-codes";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

const allowedDurations = new Set([7, 14, 30, 90]);

export async function grantPremiumAccessAction(formData: FormData) {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const durationDays = Number(formData.get("durationDays"));
  if (!email.includes("@") || !allowedDurations.has(durationDays)) redirect("/admin/billing?error=grant");
  const [user, plan] = await Promise.all([db.user.findUnique({ where: { email } }), db.plan.findFirst({ where: { code: "PREMIUM_MONTHLY", active: true } })]);
  if (!user || !plan) redirect("/admin/billing?error=user");
  const now = new Date();
  await db.$transaction(async (tx) => {
    const current = await tx.subscription.findFirst({ where: { subscriberId: user.id, creatorId: null, type: "PLATFORM_PREMIUM", status: { in: ["ACTIVE", "PENDING"] } }, orderBy: { currentPeriodEnd: "desc" } });
    const base = current?.currentPeriodEnd && current.currentPeriodEnd > now ? current.currentPeriodEnd : now;
    const end = new Date(base.getTime() + durationDays * 86400000);
    if (current) await tx.subscription.update({ where: { id: current.id }, data: { planId: plan.id, provider: "MANUAL", status: "ACTIVE", currentPeriodStart: current.currentPeriodStart ?? now, currentPeriodEnd: end, canceledAt: null } });
    else await tx.subscription.create({ data: { subscriberId: user.id, planId: plan.id, type: "PLATFORM_PREMIUM", provider: "MANUAL", status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: end } });
    await tx.adminAuditLog.create({ data: { adminId: admin.id, action: "PREMIUM_GRANTED", targetType: "USER", targetId: user.id, details: `${durationDays} dias` } });
  });
  revalidatePath("/admin/billing"); revalidatePath("/dashboard"); redirect("/admin/billing?success=grant");
}

export async function createAccessCodeAction(formData: FormData) {
  const admin = await requireAdmin();
  const code = normalizeAccessCode(String(formData.get("code") ?? ""));
  const label = String(formData.get("label") ?? "").trim().slice(0, 80);
  const durationDays = Number(formData.get("durationDays"));
  const maxRedemptions = Number(formData.get("maxRedemptions"));
  const expiresInDays = Number(formData.get("expiresInDays"));
  if (!/^[A-Z0-9-]{6,40}$/.test(code) || !label || !allowedDurations.has(durationDays) || !Number.isInteger(maxRedemptions) || maxRedemptions < 1 || maxRedemptions > 100 || ![7, 30, 90].includes(expiresInDays)) redirect("/admin/billing?error=code");
  try {
    await db.$transaction([
      db.accessCode.create({ data: { codeHash: hashAccessCode(code), label, durationDays, maxRedemptions, expiresAt: new Date(Date.now() + expiresInDays * 86400000), createdBy: admin.id } }),
      db.adminAuditLog.create({ data: { adminId: admin.id, action: "ACCESS_CODE_CREATED", targetType: "ACCESS_CODE", details: `${label}; ${durationDays} dias; limite ${maxRedemptions}` } }),
    ]);
  } catch { redirect("/admin/billing?error=duplicate"); }
  revalidatePath("/admin/billing"); redirect("/admin/billing?success=code");
}

export async function disableAccessCodeAction(formData: FormData) {
  const admin = await requireAdmin();
  const codeId = String(formData.get("codeId") ?? "");
  if (!codeId) return;
  await db.$transaction([
    db.accessCode.update({ where: { id: codeId }, data: { active: false } }),
    db.adminAuditLog.create({ data: { adminId: admin.id, action: "ACCESS_CODE_DISABLED", targetType: "ACCESS_CODE", targetId: codeId } }),
  ]);
  revalidatePath("/admin/billing");
}

export async function revokePremiumAccessAction(formData: FormData) {
  const admin = await requireAdmin();
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const subscription = await db.subscription.findFirst({ where: { id: subscriptionId, type: "PLATFORM_PREMIUM", status: "ACTIVE" }, select: { id: true, subscriberId: true } });
  if (!subscription) return;
  await db.$transaction([
    db.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELED", canceledAt: new Date(), currentPeriodEnd: new Date() } }),
    db.adminAuditLog.create({ data: { adminId: admin.id, action: "PREMIUM_REVOKED", targetType: "USER", targetId: subscription.subscriberId } }),
  ]);
  revalidatePath("/admin/billing"); revalidatePath("/dashboard");
}
