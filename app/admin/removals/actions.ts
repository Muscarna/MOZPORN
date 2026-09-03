"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function decideRemovalRequestAction(formData: FormData) {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const adminNotes = String(formData.get("adminNotes") ?? "").trim().slice(0, 2000);
  if (!requestId || !["REVIEWING", "REJECTED", "ACTIONED"].includes(decision)) return;
  const request = await db.removalRequest.findUnique({ where: { id: requestId }, select: { id: true, contentId: true } });
  if (!request) return;
  await db.$transaction(async (tx) => {
    if (decision === "ACTIONED" && request.contentId) {
      await tx.content.update({ where: { id: request.contentId }, data: { status: "REMOVED", rejectionReason: "Removido após pedido de proteção de direitos.", reviewedAt: new Date(), reviewedBy: admin.id } });
      await tx.contentReport.updateMany({ where: { contentId: request.contentId, status: "OPEN" }, data: { status: "ACTIONED", reviewedAt: new Date(), reviewedBy: admin.id } });
    }
    await tx.removalRequest.update({ where: { id: request.id }, data: { status: decision as "REVIEWING" | "REJECTED" | "ACTIONED", adminNotes: adminNotes || null, reviewedAt: decision === "REVIEWING" ? null : new Date(), reviewedBy: admin.id } });
    await tx.adminAuditLog.create({ data: { adminId: admin.id, action: `REMOVAL_${decision}`, targetType: "REMOVAL_REQUEST", targetId: request.id, details: adminNotes || null } });
  });
  revalidatePath("/admin/removals"); revalidatePath("/admin"); revalidatePath("/feed");
}
