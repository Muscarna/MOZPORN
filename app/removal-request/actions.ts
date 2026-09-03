"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { markSecurityEventSuccess, rateLimitAttempt } from "@/lib/rate-limit";

const reasons = new Set(["POSSIBLE_MINOR", "NON_CONSENSUAL", "RIGHTS_VIOLATION", "IMPERSONATION", "OTHER_ILLEGAL"]);

export async function createRemovalRequestAction(formData: FormData) {
  const requesterName = String(formData.get("requesterName") ?? "").trim();
  const requesterEmail = String(formData.get("requesterEmail") ?? "").trim().toLowerCase();
  const contentRef = String(formData.get("contentRef") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "").trim();
  const reason = String(formData.get("reason") ?? "");
  const details = String(formData.get("details") ?? "").trim();
  const goodFaith = formData.get("goodFaith") === "on";
  if (requesterName.length < 2 || requesterName.length > 100 || !/^\S+@\S+\.\S+$/.test(requesterEmail) || contentRef.length < 3 || contentRef.length > 500 || relationship.length < 2 || relationship.length > 100 || !reasons.has(reason) || details.length < 20 || details.length > 3000 || !goodFaith) redirect("/removal-request?error=invalid");
  const attempt = await rateLimitAttempt("REMOVAL_REQUEST", 5, 24 * 60 * 60 * 1000, requesterEmail);
  if (!attempt.allowed) redirect("/removal-request?error=limited");
  const possibleId = contentRef.match(/[a-z0-9]{20,30}/i)?.[0];
  const content = possibleId ? await db.content.findUnique({ where: { id: possibleId }, select: { id: true } }) : null;
  const request = await db.removalRequest.create({ data: { requesterName, requesterEmail, contentRef, contentId: content?.id, relationship, reason: reason as "POSSIBLE_MINOR" | "NON_CONSENSUAL" | "RIGHTS_VIOLATION" | "IMPERSONATION" | "OTHER_ILLEGAL", details, goodFaith } });
  await markSecurityEventSuccess(attempt.eventId);
  redirect(`/removal-request?success=${request.reference}`);
}
