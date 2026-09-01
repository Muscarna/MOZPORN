"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function startCheckoutAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const planCode = String(formData.get("planCode") ?? "");
  const creatorId = String(formData.get("creatorId") ?? "") || null;
  const plan = await db.plan.findFirst({ where: { code: planCode, active: true } });
  if (!plan) redirect("/premium?billing=invalid-plan");
  if (plan.type === "CREATOR" && !creatorId) redirect("/premium?billing=creator-required");
  if (creatorId) {
    const creator = await db.creatorProfile.findFirst({ where: { id: creatorId, status: "APPROVED", isPublic: true }, select: { id: true } });
    if (!creator) redirect("/premium?billing=invalid-creator");
  }

  const flexFormId = process.env.CCBILL_FLEXFORM_ID;
  const subscriptionTypeId = plan.type === "CREATOR"
    ? process.env.CCBILL_CREATOR_SUBSCRIPTION_TYPE_ID
    : process.env.CCBILL_PREMIUM_SUBSCRIPTION_TYPE_ID;
  if (!flexFormId || !subscriptionTypeId || !process.env.CCBILL_WEBHOOK_SECRET) {
    redirect("/premium?billing=provider-pending");
  }

  const existing = await db.subscription.findFirst({
    where: { subscriberId: user.id, creatorId, type: plan.type, status: { in: ["PENDING", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existing?.status === "ACTIVE") redirect("/dashboard?subscription=active");

  const subscription = existing ?? await db.subscription.create({
    data: { subscriberId: user.id, creatorId, planId: plan.id, type: plan.type, provider: "CCBILL" },
  });
  await db.payment.create({
    data: {
      userId: user.id,
      subscriptionId: subscription.id,
      provider: "CCBILL",
      status: "PENDING",
      amountMinor: plan.amountMinor,
      currency: plan.currency,
    },
  });

  const url = new URL(`https://api.ccbill.com/wap-frontflex/flexforms/${flexFormId}`);
  url.searchParams.set("subscriptionTypeId", subscriptionTypeId);
  url.searchParams.set("email", user.email);
  url.searchParams.set("X-checkoutReference", subscription.checkoutReference);
  url.searchParams.set("X-planCode", plan.code);
  redirect(url.toString());
}
