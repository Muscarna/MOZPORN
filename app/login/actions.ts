"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { markSecurityEventSuccess, rateLimitAttempt } from "@/lib/rate-limit";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect("/login?error=1");
  const attempt = await rateLimitAttempt("LOGIN", 10, 15 * 60 * 1000, parsed.data.email.toLowerCase());
  if (!attempt.allowed) redirect("/login?error=limited");
  const user = await db.user.findUnique({ where:{email:parsed.data.email.toLowerCase()} });
  if (!user || !(await verifyPassword(parsed.data.password,user.passwordHash))) redirect("/login?error=1");
  if (user.status === "SUSPENDED") redirect("/login?error=suspended");
  await markSecurityEventSuccess(attempt.eventId);
  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : user.role === "CREATOR" ? "/creator" : "/dashboard");
}
