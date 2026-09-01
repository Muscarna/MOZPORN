import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportContentAction } from "./actions";
import { hasCreatorSubscription, hasPremiumAccess } from "@/lib/billing";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const contents = await db.content.findMany({
    where: { status: "APPROVED", visibility: { not: "PRIVATE" }, mediaUrl: { not: null } },
    include: { creator: { select: { username: true, displayName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const premium = await hasPremiumAccess(user.id);
  const accessible = (await Promise.all(contents.map(async (content) => {
    if (content.visibility === "PUBLIC") return content;
    if (content.visibility === "FOLLOWERS") return await db.creatorFollow.findUnique({ where: { followerId_creatorId: { followerId: user.id, creatorId: content.creatorId } } }) ? content : null;
    if (content.visibility === "SUBSCRIBERS") return premium || await hasCreatorSubscription(user.id, content.creatorId) ? content : null;
    return null;
  }))).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return <><Header/><main className="page-shell"><div className="section-title">
    <div><span className="eyebrow">FEED</span><h1>Conteúdo aprovado</h1></div>
  </div>{accessible.length === 0 ? <div className="empty-state"><h2>Ainda não há publicações</h2><p>Conteúdos disponíveis para o seu acesso aparecerão aqui.</p></div> : <div className="content-feed">
    {accessible.map((content) => <article className="content-card" key={content.id}>
      <div className="content-meta"><Link href={`/creators/${content.creator.username}`}>@{content.creator.username}</Link><span>{content.createdAt.toLocaleDateString("pt-PT")}</span></div>
      <h2>{content.title}</h2>{content.description ? <p>{content.description}</p> : null}
      {content.mediaType === "VIDEO" ? <video className="content-media" src={`/api/media/${content.id}`} controls preload="metadata" /> : <img className="content-media" src={`/api/media/${content.id}`} alt={content.title} />}
      {user.role !== "ADMIN" ? <details className="report-box"><summary>Denunciar conteúdo</summary><form action={reportContentAction} className="inline-form"><input type="hidden" name="contentId" value={content.id}/><input name="reason" minLength={3} maxLength={200} placeholder="Motivo da denúncia" required/><button className="btn secondary">Enviar</button></form></details> : null}
    </article>)}
  </div>}</main></>;
}
