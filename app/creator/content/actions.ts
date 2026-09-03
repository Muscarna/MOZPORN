"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/permissions";

const visibilityValues = new Set(["PUBLIC", "FOLLOWERS", "SUBSCRIBERS", "PRIVATE"]);

export async function updateContentAction(formData: FormData) {
  const user = await requireCreator();
  const contentId = String(formData.get("contentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "");
  if (title.length < 3 || title.length > 100 || description.length > 2000 || !visibilityValues.has(visibility)) redirect(`/creator/content/${contentId}?error=invalid`);
  const content = await db.content.findFirst({ where: { id: contentId, creator: { userId: user.id }, status: { not: "REMOVED" } }, select: { id: true, status: true } });
  if (!content) redirect("/creator");
  await db.content.update({ where: { id: content.id }, data: { title, description: description || null, visibility: visibility as "PUBLIC" | "FOLLOWERS" | "SUBSCRIBERS" | "PRIVATE", status: content.status === "DRAFT" ? "DRAFT" : "PENDING_REVIEW", rejectionReason: null, reviewedAt: null, reviewedBy: null } });
  revalidatePath("/creator"); revalidatePath("/feed"); revalidatePath("/admin/content");
  redirect(`/creator/content/${content.id}?success=1`);
}

export async function deleteContentAction(formData: FormData) {
  const user = await requireCreator();
  const contentId = String(formData.get("contentId") ?? "");
  const content = await db.content.findFirst({ where: { id: contentId, creator: { userId: user.id } }, select: { id: true, mediaUrl: true } });
  if (!content) redirect("/creator");
  if (content.mediaUrl) await del(content.mediaUrl);
  await db.content.delete({ where: { id: content.id } });
  revalidatePath("/creator"); revalidatePath("/feed"); revalidatePath("/admin/content");
  redirect("/creator?deleted=1");
}
