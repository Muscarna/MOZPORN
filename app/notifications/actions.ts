"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const notificationId = String(formData.get("notificationId") ?? "");
  const notification = await db.notification.findFirst({ where: { id: notificationId, userId: user.id }, select: { id: true, href: true } });
  if (!notification) redirect("/notifications");
  await db.notification.update({ where: { id: notification.id }, data: { readAt: new Date() } });
  revalidatePath("/notifications"); revalidatePath("/");
  redirect(notification.href?.startsWith("/") && !notification.href.startsWith("//") ? notification.href : "/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications"); revalidatePath("/");
}
