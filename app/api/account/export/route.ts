import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const [following, favorites, blocks, subscriptions, payments, reports, notifications] = await Promise.all([
    db.creatorFollow.findMany({ where: { followerId: user.id }, include: { creator: { select: { username: true, displayName: true } } } }),
    db.contentFavorite.findMany({ where: { userId: user.id }, include: { content: { select: { id: true, title: true } } } }),
    db.creatorBlock.findMany({ where: { userId: user.id }, include: { creator: { select: { username: true } } } }),
    db.subscription.findMany({ where: { subscriberId: user.id }, select: { type: true, status: true, createdAt: true, currentPeriodEnd: true } }),
    db.payment.findMany({ where: { userId: user.id }, select: { status: true, amountMinor: true, currency: true, createdAt: true } }),
    db.contentReport.findMany({ where: { reporterId: user.id }, select: { contentId: true, reason: true, details: true, status: true, createdAt: true } }),
    db.notification.findMany({ where: { userId: user.id }, select: { type: true, title: true, message: true, readAt: true, createdAt: true } }),
  ]);
  const payload = { exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status, createdAt: user.createdAt }, creatorProfile: user.creatorProfile, following, favorites, blockedCreators: blocks, subscriptions, payments, reports, notifications };
  return new NextResponse(JSON.stringify(payload, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="mozporn-dados-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "private, no-store" } });
}
