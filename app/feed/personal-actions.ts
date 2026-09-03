"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function toggleFavoriteAction(formData: FormData) {
  const user = await requireUser();
  const contentId = String(formData.get("contentId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/feed");
  const content = await db.content.findFirst({ where: { id: contentId, status: "APPROVED", mediaUrl: { not: null } }, select: { id: true, creatorId: true } });
  if (!content) return;
  const blocked = await db.creatorBlock.findUnique({ where: { userId_creatorId: { userId: user.id, creatorId: content.creatorId } } });
  if (blocked) return;
  const existing = await db.contentFavorite.findUnique({ where: { userId_contentId: { userId: user.id, contentId } } });
  if (existing) await db.contentFavorite.delete({ where: { id: existing.id } });
  else await db.contentFavorite.create({ data: { userId: user.id, contentId } });
  revalidatePath("/feed"); revalidatePath("/favorites");
  redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/feed");
}

export async function toggleCreatorBlockAction(formData: FormData) {
  const user = await requireUser();
  const creatorId = String(formData.get("creatorId") ?? "");
  const creator = await db.creatorProfile.findUnique({ where: { id: creatorId }, select: { id: true, userId: true, username: true } });
  if (!creator || creator.userId === user.id) return;
  const existing = await db.creatorBlock.findUnique({ where: { userId_creatorId: { userId: user.id, creatorId } } });
  if (existing) await db.creatorBlock.delete({ where: { id: existing.id } });
  else await db.$transaction([db.creatorBlock.create({ data: { userId: user.id, creatorId } }), db.creatorFollow.deleteMany({ where: { followerId: user.id, creatorId } }), db.contentFavorite.deleteMany({ where: { userId: user.id, content: { creatorId } } })]);
  revalidatePath("/feed"); revalidatePath("/favorites"); revalidatePath(`/creators/${creator.username}`);
  redirect(existing ? `/creators/${creator.username}` : "/creators");
}
