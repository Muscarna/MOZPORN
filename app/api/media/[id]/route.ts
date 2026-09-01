import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCreatorSubscription, hasPremiumAccess } from "@/lib/billing";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });

  const { id } = await params;
  const content = await db.content.findUnique({
    where: { id },
    include: { creator: { select: { userId: true } } },
  });
  if (!content?.mediaUrl) return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 });

  let allowed = user.role === "ADMIN" || content.creator.userId === user.id;
  if (!allowed && content.status === "APPROVED") {
    if (content.visibility === "PUBLIC") allowed = true;
    if (content.visibility === "FOLLOWERS") {
      allowed = Boolean(await db.creatorFollow.findUnique({
        where: { followerId_creatorId: { followerId: user.id, creatorId: content.creatorId } },
      }));
    }
    if (content.visibility === "SUBSCRIBERS") {
      allowed = await hasCreatorSubscription(user.id, content.creatorId) || await hasPremiumAccess(user.id);
    }
  }
  if (!allowed) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const result = await get(content.mediaUrl, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "Mídia indisponível." }, { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Content-Length": String(result.blob.size),
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
