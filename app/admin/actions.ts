"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
export async function updateVerificationStatus(formData:FormData){const admin=await requireAdmin();const requestId=String(formData.get("requestId")??"");const status=String(formData.get("status")??"");const reason=String(formData.get("rejectionReason")??"").trim();if(!["PENDING","APPROVED","REJECTED"].includes(status))redirect("/admin/verifications?error=invalid");const request=await db.verificationRequest.findUnique({where:{id:requestId},include:{user:true,creatorProfile:true}});if(!request)redirect("/admin/verifications?error=notfound");if(status==="APPROVED"){await db.$transaction(async tx=>{await tx.verificationRequest.update({where:{id:requestId},data:{status:"APPROVED",reviewedAt:new Date(),reviewedBy:admin.id,rejectionReason:null}});await tx.user.update({where:{id:request.userId},data:{role:"CREATOR"}});if(request.creatorProfile)await tx.creatorProfile.update({where:{id:request.creatorProfile.id},data:{status:"APPROVED",isPublic:true}});await tx.adminAuditLog.create({data:{adminId:admin.id,action:"CREATOR_VERIFIED",targetType:"USER",targetId:request.userId,details:"Candidatura de creator aprovada."}})});}else if(status==="REJECTED"){await db.$transaction(async tx=>{await tx.verificationRequest.update({where:{id:requestId},data:{status:"REJECTED",reviewedAt:new Date(),reviewedBy:admin.id,rejectionReason:reason||"Candidatura rejeitada."}});if(request.creatorProfile)await tx.creatorProfile.update({where:{id:request.creatorProfile.id},data:{status:"PENDING",isPublic:false}});await tx.adminAuditLog.create({data:{adminId:admin.id,action:"CREATOR_VERIFICATION_REJECTED",targetType:"USER",targetId:request.userId,details:reason||"Candidatura rejeitada."}})});}else{await db.verificationRequest.update({where:{id:requestId},data:{status:"PENDING",reviewedAt:null,reviewedBy:null,rejectionReason:null}})}if(status==="APPROVED"||status==="REJECTED")await db.notification.create({data:{userId:request.userId,type:"CREATOR",title:status==="APPROVED"?"Candidatura aprovada":"Candidatura rejeitada",message:status==="APPROVED"?"O seu perfil de criador foi aprovado.":reason||"A sua candidatura de criador foi rejeitada.",href:status==="APPROVED"?"/creator":"/dashboard"}});redirect("/admin/verifications?success=1")}

export async function moderateContentAction(formData: FormData) {
  const admin = await requireAdmin();
  const contentId = String(formData.get("contentId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["APPROVED", "REJECTED", "REMOVED"].includes(decision)) return;
  const target = await db.content.findUnique({ where: { id: contentId }, select: { title: true, creator: { select: { userId: true } } } });
  if (!target) return;

  if (decision === "APPROVED") {
    const attestation = await db.contentAttestation.findUnique({ where: { contentId } });
    if (!attestation || !attestation.uploaderAdult || !attestation.allParticipantsAdults || !attestation.consentObtained || !attestation.distributionRights) {
      redirect("/admin/content?error=attestation");
    }
  }

  await db.$transaction(async (tx) => {
    await tx.content.update({
      where: { id: contentId },
      data: {
        status: decision as "APPROVED" | "REJECTED" | "REMOVED",
        rejectionReason: decision === "APPROVED" ? null : reason || "Conteúdo não aprovado.",
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      },
    });
    await tx.adminAuditLog.create({
      data: { adminId: admin.id, action: `CONTENT_${decision}`, targetType: "CONTENT", targetId: contentId, details: reason || null },
    });
    await tx.notification.create({ data: { userId: target.creator.userId, type: "CONTENT", title: decision === "APPROVED" ? "Publicação aprovada" : decision === "REJECTED" ? "Publicação rejeitada" : "Publicação removida", message: decision === "APPROVED" ? `“${target.title}” já está disponível.` : reason || `“${target.title}” não está disponível.`, href: "/creator" } });
  });
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath("/feed");
}

export async function moderateReportAction(formData: FormData) {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  const decision = String(formData.get("decision") ?? "DISMISSED");
  if (!["DISMISSED", "ACTIONED", "REMOVE_CONTENT"].includes(decision)) return;
  const report = await db.contentReport.findUnique({ where: { id: reportId }, select: { contentId: true } });
  if (!report) return;
  await db.$transaction(async (tx) => {
    if (decision === "REMOVE_CONTENT") {
      await tx.content.update({ where: { id: report.contentId }, data: { status: "REMOVED", rejectionReason: "Removido após denúncia.", reviewedAt: new Date(), reviewedBy: admin.id } });
      await tx.contentReport.updateMany({ where: { contentId: report.contentId, status: "OPEN" }, data: { status: "ACTIONED", reviewedAt: new Date(), reviewedBy: admin.id } });
    } else {
      await tx.contentReport.update({ where: { id: reportId }, data: { status: decision as "DISMISSED" | "ACTIONED", reviewedAt: new Date(), reviewedBy: admin.id } });
    }
    await tx.adminAuditLog.create({ data: { adminId: admin.id, action: decision === "REMOVE_CONTENT" ? "REPORT_CONTENT_REMOVED" : `REPORT_${decision}`, targetType: "CONTENT_REPORT", targetId: reportId } });
  });
  revalidatePath("/admin/content");
  revalidatePath("/feed");
}

export async function updateAccountStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!userId || userId === admin.id || !["SUSPEND", "REACTIVATE"].includes(decision)) return;
  if (decision === "SUSPEND" && reason.length < 5) redirect("/admin/users?error=reason");
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: decision === "SUSPEND" ? { status: "SUSPENDED", suspendedAt: new Date(), suspendedBy: admin.id, suspensionReason: reason } : { status: "ACTIVE", suspendedAt: null, suspendedBy: null, suspensionReason: null } });
    await tx.creatorProfile.updateMany({ where: { userId }, data: decision === "SUSPEND" ? { status: "SUSPENDED", isPublic: false } : { status: "PENDING", isPublic: false } });
    await tx.adminAuditLog.create({ data: { adminId: admin.id, action: decision === "SUSPEND" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED", targetType: "USER", targetId: userId, details: reason || null } });
    await tx.notification.create({ data: { userId, type: "ACCOUNT", title: decision === "SUSPEND" ? "Conta suspensa" : "Conta reativada", message: decision === "SUSPEND" ? `A sua conta foi suspensa. Motivo: ${reason}` : "A sua conta foi reativada. Se era criador, a candidatura deverá ser revista novamente.", href: decision === "SUSPEND" ? null : "/dashboard" } });
  });
  revalidatePath("/admin/users"); revalidatePath("/creators"); revalidatePath("/feed");
}
