import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const types = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user || user.role !== "CREATOR" || user.creatorProfile?.status !== "APPROVED" || !clientPayload) {
          throw new Error("Publicação não autorizada.");
        }

        const content = await db.content.findFirst({
          where: { id: clientPayload, creatorId: user.creatorProfile.id, status: "DRAFT" },
          select: { id: true },
        });
        if (!content) throw new Error("Rascunho inválido.");

        return {
          allowedContentTypes: types,
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ contentId: content.id, userId: user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const payload = JSON.parse(tokenPayload) as { contentId: string; userId: string };
        const mediaType = blob.contentType.startsWith("video/") ? "VIDEO" : "IMAGE";

        await db.content.updateMany({
          where: {
            id: payload.contentId,
            status: "DRAFT",
            creator: { userId: payload.userId },
          },
          data: {
            mediaUrl: blob.url,
            mediaType,
            mimeType: blob.contentType,
            status: "PENDING_REVIEW",
          },
        });
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Falha no upload privado", error);
    return NextResponse.json({ error: "Não foi possível autorizar o upload." }, { status: 400 });
  }
}
