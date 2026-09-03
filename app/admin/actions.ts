"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
export async function updateVerificationStatus(formData:FormData){const admin=await requireAdmin();const requestId=String(formData.get("requestId")??"");const status=String(formData.get("status")??"");const reason=String(formData.get("rejectionReason")??"").trim();if(!["PENDING","APPROVED","REJECTED"].includes(status))redirect("/admin/verifications?error=invalid");const request=await db.verificationRequest.findUnique({where:{id:requestId},include:{user:true,creatorProfile:true}});if(!request)redirect("/admin/verifications?error=notfound");if(status==="APPROVED"){await db.$transaction(async tx=>{await tx.verificationRequest.update({where:{id:requestId},data:{status:"APPROVED",reviewedAt:new Date(),reviewedBy:admin.id,rejectionReason:null}});await tx.user.update({where:{id:request.userId},data:{role:"CREATOR"}});if(request.creatorProfile)await tx.creatorProfile.update({where:{id:request.creatorProfile.id},data:{status:"APPROVED",isPublic:true}});await tx.adminAuditLog.create({data:{adminId:admin.id,action:"CREATOR_VERIFIED",targetType:"USER",targetId:request.userId,details:"Candidatura de creator aprovada."}})});}else if(status==="REJECTED"){await db.$transaction(async tx=>{await tx.verificationRequest.update({where:{id:requestId},data:{status:"REJECTED",reviewedAt:new Date(),reviewedBy:admin.id,rejectionReason:reason||"Candidatura rejeitada."}});if(request.creatorProfile)await tx.creatorProfile.update({where:{id:request.creatorProfile.id},data:{status:"PENDING",isPublic:false}});await tx.adminAuditLog.create({data:{adminId:admin.id,action:"CREATOR_VERIFICATION_REJECTED",targetType:"USER",targetId:request.userId,details:reason||"Candidatura rejeitada."}})});}else{await db.verificationRequest.update({where:{id:requestId},data:{status:"PENDING",reviewedAt:null,reviewedBy:null,rejectionReason:null}})}redirect("/admin/verifications?success=1")}

export async function moderateContentAction(formData: FormData) {
  const admin = await requireAdmin();
  const contentId = String(formData.get("contentId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["APPROVED", "REJECTED", "REMOVED"].includes(decision)) return;

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
  });
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath("/feed");
}

export async function moderateReportAction(formData: FormData) {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  const decision = String(formData.get("decision") ?? "DISMISSED");
  if (!["DISMISSED", "ACTIONED"].includes(decision)) return;
  await db.$transaction([
    db.contentReport.update({ where: { id: reportId }, data: { status: decision as "DISMISSED" | "ACTIONED", reviewedAt: new Date(), reviewedBy: admin.id } }),
    db.adminAuditLog.create({ data: { adminId: admin.id, action: `REPORT_${decision}`, targetType: "CONTENT_REPORT", targetId: reportId } }),
  ]);
  revalidatePath("/admin/content");
}
