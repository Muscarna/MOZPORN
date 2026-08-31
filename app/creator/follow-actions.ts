"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export async function toggleFollow(formData:FormData){const user=await getCurrentUser();if(!user)redirect("/login");const creatorId=String(formData.get("creatorId")??"");const creator=await db.creatorProfile.findFirst({where:{id:creatorId,status:"APPROVED",isPublic:true}});if(!creator||creator.userId===user.id)redirect("/creators");const existing=await db.creatorFollow.findUnique({where:{followerId_creatorId:{followerId:user.id,creatorId:creator.id}}});if(existing)await db.creatorFollow.delete({where:{id:existing.id}});else await db.creatorFollow.create({data:{followerId:user.id,creatorId:creator.id}});redirect(`/creators/${creator.username}`)}
