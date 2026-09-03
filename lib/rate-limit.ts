import { createHash } from "crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function rateLimitAttempt(action: string, limit: number, windowMs: number, subject?: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const agent = requestHeaders.get("user-agent") ?? "unknown";
  const secret = process.env.AUTH_SECRET ?? "local-rate-limit";
  const fingerprintHash = createHash("sha256").update(`${secret}:${forwarded}:${agent}`).digest("hex");
  const since = new Date(Date.now() - windowMs);
  const recent = await db.securityEvent.count({ where: { fingerprintHash, action, createdAt: { gte: since } } });
  const event = await db.securityEvent.create({ data: { fingerprintHash, action, subject: subject?.slice(0, 160), success: false } });
  return { allowed: recent < limit, eventId: event.id };
}

export async function markSecurityEventSuccess(eventId: string) {
  await db.securityEvent.update({ where: { id: eventId }, data: { success: true } });
}
