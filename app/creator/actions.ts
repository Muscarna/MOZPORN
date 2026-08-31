"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function normalizeUsername(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,30)}
export async function applyAsCreator(formData:FormData){const user=await getCurrentUser();if(!user)redirect("/login");if(user.role!=="USER")redirect("/creator");const username=normalizeUsername(String(formData.get("username")??""));const displayName=String(formData.get("displayName")??"").trim();const bio=String(formData.get("bio")??"").trim();if(formData.get("agreement")!=="on"||username.length<3||displayName.length<2)redirect("/creator/apply?error=invalid");const taken=await db.creatorProfile.findUnique({where:{username}});if(taken&&taken.userId!==user.id)redirect("/creator/apply?error=username");const pending=await db.verificationRequest.findFirst({where:{userId:user.id,status:"PENDING"}});if(pending)redirect("/dashboard?verification=pending");const profile=await db.creatorProfile.upsert({where:{userId:user.id},create:{userId:user.id,username,displayName,bio:bio||null,status:"PENDING",isPublic:false},update:{username,displayName,bio:bio||null,status:"PENDING",isPublic:false}});await db.verificationRequest.create({data:{userId:user.id,creatorProfileId:profile.id,status:"PENDING"}});redirect("/dashboard?verification=submitted");}
