"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function updateAccountNameAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) redirect("/account?error=name");
  await db.user.update({ where: { id: user.id }, data: { name } });
  await db.notification.create({ data: { userId: user.id, type: "ACCOUNT", title: "Nome atualizado", message: "O nome da sua conta foi alterado.", href: "/account" } });
  revalidatePath("/account"); revalidatePath("/dashboard");
  redirect("/account?success=name");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) redirect("/account?error=password");
  if (newPassword.length < 12 || newPassword !== confirmation || newPassword === currentPassword) redirect("/account?error=new-password");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await db.notification.create({ data: { userId: user.id, type: "SECURITY", title: "Palavra-passe alterada", message: "A palavra-passe da sua conta foi atualizada.", href: "/account" } });
  redirect("/account?success=password");
}

export async function unblockCreatorAction(formData: FormData) {
  const user = await requireUser();
  const creatorId = String(formData.get("creatorId") ?? "");
  await db.creatorBlock.deleteMany({ where: { userId: user.id, creatorId } });
  revalidatePath("/account"); revalidatePath("/feed");
  redirect("/account?success=unblocked");
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/account?error=admin-delete");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "ELIMINAR" || !(await verifyPassword(password, user.passwordHash))) redirect("/account?error=delete");
  const contents = user.creatorProfile ? await db.content.findMany({ where: { creatorId: user.creatorProfile.id, mediaUrl: { not: null } }, select: { mediaUrl: true } }) : [];
  const urls = contents.flatMap((item) => item.mediaUrl ? [item.mediaUrl] : []);
  if (urls.length) await del(urls);
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/?account=deleted");
}
