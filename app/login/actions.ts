"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect("/login?error=1");
  const user = await db.user.findUnique({ where:{email:parsed.data.email.toLowerCase()} });
  if (!user || !(await verifyPassword(parsed.data.password,user.passwordHash))) redirect("/login?error=1");
  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : user.role === "CREATOR" ? "/creator" : "/dashboard");
}
