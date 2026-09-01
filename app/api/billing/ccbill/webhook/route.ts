import { NextResponse } from "next/server";

import { db } from "@/lib/db";

function allowedIp(value: string) {
  const match = value.match(/^64\.38\.(212|215|240|241)\.(\d{1,3})$/);
  return Boolean(match && Number(match[2]) >= 1 && Number(match[2]) <= 254);
}

function textValue(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) if (typeof source[key] === "string") return source[key] as string;
  return "";
}

export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (!process.env.CCBILL_WEBHOOK_SECRET || secret !== process.env.CCBILL_WEBHOOK_SECRET || !allowedIp(forwarded)) {
    return NextResponse.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let event: Record<string, unknown>;
  if (contentType.includes("application/json")) {
    event = await request.json();
  } else {
    const form = await request.formData();
    event = Object.fromEntries(form.entries()) as Record<string, unknown>;
  }

  const eventType = textValue(event, "eventType", "event_type", "type");
  const checkoutReference = textValue(event, "X-checkoutReference", "X-checkoutreference", "checkoutReference");
  const providerRef = textValue(event, "subscriptionId", "subscription_id");
  const transactionRef = textValue(event, "transactionId", "transaction_id");
  const eventRef = textValue(event, "eventId", "event_id") || `${eventType}:${transactionRef || providerRef}`;
  if (!eventType || !checkoutReference) return NextResponse.json({ error: "Evento incompleto." }, { status: 400 });

  const subscription = await db.subscription.findUnique({
    where: { checkoutReference }, include: { plan: true },
  });
  if (!subscription) return NextResponse.json({ error: "Assinatura desconhecida." }, { status: 404 });

  const successful = ["NewSaleSuccess", "RenewalSuccess", "RebillSuccess"].includes(eventType);
  const canceled = ["Cancellation", "CancelSuccess", "Expiration"].includes(eventType);
  const reversed = ["Chargeback", "Refund", "Void"].includes(eventType);
  const now = new Date();

  if (successful) {
    await db.$transaction(async (tx) => {
      const recorded = await tx.payment.findUnique({ where: { eventRef } });
      const pending = !recorded && eventType === "NewSaleSuccess" ? await tx.payment.findFirst({ where: { subscriptionId: subscription.id, status: "PENDING", eventRef: null }, orderBy: { createdAt: "desc" } }) : null;
      const payment = recorded ? await tx.payment.update({ where: { id: recorded.id }, data: { status: "SUCCEEDED", paidAt: now } }) : pending ? await tx.payment.update({ where: { id: pending.id }, data: { eventRef, providerRef: transactionRef || undefined, status: "SUCCEEDED", paidAt: now, rawEvent: JSON.stringify({ eventType }) } }) : await tx.payment.create({ data: {
          userId: subscription.subscriberId, subscriptionId: subscription.id, provider: "CCBILL",
          providerRef: transactionRef || null, eventRef, status: "SUCCEEDED", amountMinor: subscription.plan.amountMinor,
          currency: subscription.plan.currency, paidAt: now, rawEvent: JSON.stringify({ eventType }),
        } });
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE", providerRef: providerRef || undefined, currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + subscription.plan.billingDays * 86400000), canceledAt: null,
        },
      });
      if (subscription.creatorId) {
        const platformFeeMinor = Math.round(subscription.plan.amountMinor * 0.2);
        await tx.creatorEarning.upsert({
          where: { paymentId: payment.id }, update: {},
          create: {
            creatorId: subscription.creatorId, paymentId: payment.id,
            grossAmountMinor: subscription.plan.amountMinor, platformFeeMinor,
            netAmountMinor: subscription.plan.amountMinor - platformFeeMinor,
            currency: subscription.plan.currency, status: "PENDING",
            availableAt: new Date(now.getTime() + 14 * 86400000),
          },
        });
      }
    });
  } else if (canceled) {
    await db.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELED", canceledAt: now } });
  } else if (reversed) {
    await db.$transaction([
      db.subscription.update({ where: { id: subscription.id }, data: { status: "PAST_DUE" } }),
      db.payment.updateMany({ where: { subscriptionId: subscription.id, providerRef: providerRef || undefined }, data: { status: eventType === "Chargeback" ? "CHARGEBACK" : "REFUNDED" } }),
      db.creatorEarning.updateMany({ where: { payment: { subscriptionId: subscription.id } }, data: { status: "REVERSED" } }),
    ]);
  }

  return NextResponse.json({ received: true });
}
