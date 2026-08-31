"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { creatorProfileSchema } from "@/lib/validation";
export async function updateCreatorProfile(formData:FormData){const user=await getCurrentUser();if(!user||user.role!=="CREATOR")redirect("/dashboard");const parsed=creatorProfileSchema.safeParse({username:formData.get("username"),displayName:formData.get("displayName"),bio:formData.get("bio")??""});if(!parsed.success)redirect("/creator/profile?error=invalid");const existing=await db.creatorProfile.findUnique({where:{username:parsed.data.username.toLowerCase()}});if(existing&&existing.userId!==user.id)redirect("/creator/profile?error=username");const profile=await db.creatorProfile.findUnique({where:{userId:user.id}});if(!profile)redirect("/dashboard");const isPublic=formData.get("isPublic")==="on";await db.creatorProfile.update({where:{userId:user.id},data:{username:parsed.data.username.toLowerCase(),displayName:parsed.data.displayName,bio:parsed.data.bio||null,isPublic:profile.status==="APPROVED"?isPublic:false}});redirect("/creator/profile?success=1")}
