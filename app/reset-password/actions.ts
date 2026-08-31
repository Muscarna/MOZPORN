"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { hashToken } from "@/lib/tokens";

export async function resetPasswordAction(formData:FormData){const token=String(formData.get("token")??"");const password=String(formData.get("password")??"");if(token.length<20||password.length<8)redirect("/login?error=reset");const record=await db.passwordResetToken.findFirst({where:{tokenHash:hashToken(token),usedAt:null,expiresAt:{gt:new Date()}}});if(!record)redirect("/login?error=reset");await db.$transaction([db.user.update({where:{id:record.userId},data:{passwordHash:await hashPassword(password)}}),db.passwordResetToken.update({where:{id:record.id},data:{usedAt:new Date()}})]);redirect("/login?reset=1");}
