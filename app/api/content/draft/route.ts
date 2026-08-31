import { ContentVisibility } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const allowedVisibility = new Set(Object.values(ContentVisibility));

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CREATOR" || user.creatorProfile?.status !== "APPROVED") {
    return NextResponse.json({ error: "Apenas criadores aprovados podem publicar." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as null | {
    title?: string;
    description?: string;
    visibility?: ContentVisibility;
  };
  const title = body?.title?.trim() ?? "";
  const description = body?.description?.trim() || null;
  const visibility = body?.visibility ?? ContentVisibility.PUBLIC;

  if (title.length < 3 || title.length > 100 || (description?.length ?? 0) > 2000 || !allowedVisibility.has(visibility)) {
    return NextResponse.json({ error: "Dados da publicação inválidos." }, { status: 400 });
  }

  const content = await db.content.create({
    data: {
      creatorId: user.creatorProfile.id,
      title,
      description,
      visibility,
      status: "DRAFT",
    },
    select: { id: true },
  });

  return NextResponse.json(content, { status: 201 });
}
