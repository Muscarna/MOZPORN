"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success || formData.get("age") !== "on") redirect("/register?error=invalid");
  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where:{email} });
  if (existing) redirect("/login?error=exists");
  const user = await db.user.create({ data:{ name:parsed.data.name, email, passwordHash:await hashPassword(parsed.data.password) } });
  await createSession(user.id);
  redirect("/dashboard");
}
