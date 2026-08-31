"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function reportContentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const contentId = String(formData.get("contentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!contentId || reason.length < 3 || reason.length > 200) return;

  const exists = await db.content.findFirst({ where: { id: contentId, status: "APPROVED" }, select: { id: true } });
  if (!exists) return;

  await db.contentReport.upsert({
    where: { reporterId_contentId: { reporterId: user.id, contentId } },
    update: { reason, status: "OPEN", reviewedAt: null, reviewedBy: null },
    create: { reporterId: user.id, contentId, reason },
  });
  revalidatePath("/feed");
}
