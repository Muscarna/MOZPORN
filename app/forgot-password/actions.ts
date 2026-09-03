"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createRawToken, hashToken } from "@/lib/tokens";
import { rateLimitAttempt } from "@/lib/rate-limit";

export async function forgotPasswordAction(formData: FormData) {
  const email=String(formData.get("email")??"").trim().toLowerCase();
  const attempt=await rateLimitAttempt("PASSWORD_RESET_REQUEST",5,60*60*1000,email);
  if(!attempt.allowed)redirect("/forgot-password?sent=1");
  const user=await db.user.findUnique({where:{email}});
  if(user){ const raw=createRawToken(); await db.passwordResetToken.create({data:{userId:user.id,tokenHash:hashToken(raw),expiresAt:new Date(Date.now()+30*60*1000)}}); const url=`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${raw}`; console.log(`\n[MOZPORN] Password reset link for ${email}: ${url}\n`); }
  redirect("/forgot-password?sent=1");
}
