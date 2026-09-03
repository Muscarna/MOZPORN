"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { markSecurityEventSuccess, rateLimitAttempt } from "@/lib/rate-limit";

export async function reportContentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const contentId = String(formData.get("contentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const allowedReasons = new Set(["UNDERAGE", "NON_CONSENSUAL", "STOLEN", "VIOLENCE", "ILLEGAL", "SPAM", "OTHER"]);
  if (!contentId || !allowedReasons.has(reason) || details.length > 1000 || (reason === "OTHER" && details.length < 10)) return;
  const attempt = await rateLimitAttempt("CONTENT_REPORT", 10, 60 * 60 * 1000, user.id);
  if (!attempt.allowed) return;

  const exists = await db.content.findFirst({ where: { id: contentId, status: "APPROVED" }, select: { id: true } });
  if (!exists) return;

  await db.contentReport.upsert({
    where: { reporterId_contentId: { reporterId: user.id, contentId } },
    update: { reason, details: details || null, status: "OPEN", reviewedAt: null, reviewedBy: null },
    create: { reporterId: user.id, contentId, reason, details: details || null },
  });
  await markSecurityEventSuccess(attempt.eventId);
  revalidatePath("/feed");
}
