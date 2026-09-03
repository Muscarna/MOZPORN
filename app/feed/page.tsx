import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportContentAction } from "./actions";
import { hasCreatorSubscription, hasPremiumAccess } from "@/lib/billing";
import { toggleFavoriteAction } from "./personal-actions";

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; tag?: string; page?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  const q = (query.q ?? "").trim().slice(0, 80);
  const type = query.type === "IMAGE" || query.type === "VIDEO" ? query.type : "";
  const tag = (query.tag ?? "").trim().toLowerCase().slice(0, 40);
  const currentPage = Math.max(1, Math.min(100, Number.parseInt(query.page ?? "1", 10) || 1));
  const contents = await db.content.findMany({
    where: { status: "APPROVED", visibility: { not: "PRIVATE" }, mediaUrl: { not: null }, creator: { blockedBy: { none: { userId: user.id } } }, ...(type ? { mediaType: type } : {}), ...(tag ? { tags: { has: tag } } : {}), ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { creator: { displayName: { contains: q, mode: "insensitive" } } }] } : {}) },
    include: { creator: { select: { username: true, displayName: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const premium = await hasPremiumAccess(user.id);
  const favoriteIds = new Set((await db.contentFavorite.findMany({ where: { userId: user.id }, select: { contentId: true } })).map((item) => item.contentId));
  const accessible = (await Promise.all(contents.map(async (content) => {
    if (content.visibility === "PUBLIC") return content;
    if (content.visibility === "FOLLOWERS") return await db.creatorFollow.findUnique({ where: { followerId_creatorId: { followerId: user.id, creatorId: content.creatorId } } }) ? content : null;
    if (content.visibility === "SUBSCRIBERS") return premium || await hasCreatorSubscription(user.id, content.creatorId) ? content : null;
    return null;
  }))).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(accessible.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageItems = accessible.slice((page - 1) * pageSize, page * pageSize);
  const filterQuery = new URLSearchParams(); if (q) filterQuery.set("q", q); if (type) filterQuery.set("type", type); if (tag) filterQuery.set("tag", tag);

  return <><Header/><main className="page-shell"><div className="section-title">
    <div><span className="eyebrow">FEED</span><h1>Conteúdo aprovado</h1></div>
  </div><form className="discovery-filters" method="get"><input name="q" defaultValue={q} maxLength={80} placeholder="Pesquisar publicações ou criadores"/><select name="type" defaultValue={type}><option value="">Fotos e vídeos</option><option value="IMAGE">Fotos</option><option value="VIDEO">Vídeos</option></select><input name="tag" defaultValue={tag} maxLength={40} placeholder="Etiqueta"/><button className="btn primary">Filtrar</button>{q || type || tag ? <Link className="btn" href="/feed">Limpar</Link> : null}</form>{pageItems.length === 0 ? <div className="empty-state"><h2>Nenhum resultado</h2><p>Altere os filtros ou aguarde novas publicações.</p></div> : <div className="content-feed">
    {pageItems.map((content) => <article className="content-card" key={content.id}>
      <div className="content-meta"><Link href={`/creators/${content.creator.username}`}>@{content.creator.username}</Link><span>{content.createdAt.toLocaleDateString("pt-PT")}</span></div>
      <h2>{content.title}</h2>{content.description ? <p>{content.description}</p> : null}
      {content.tags.length ? <div className="tag-list">{content.tags.map((item) => <Link key={item} href={`/feed?tag=${encodeURIComponent(item)}`}>#{item}</Link>)}</div> : null}
      <p className="content-reference">Referência: {content.id}</p>
      <form action={toggleFavoriteAction} className="favorite-form"><input type="hidden" name="contentId" value={content.id}/><input type="hidden" name="returnTo" value="/feed"/><button className="btn secondary">{favoriteIds.has(content.id) ? "★ Remover dos favoritos" : "☆ Guardar nos favoritos"}</button></form>
      {content.mediaType === "VIDEO" ? <video className="content-media" src={`/api/media/${content.id}`} controls preload="metadata" /> : <img className="content-media" src={`/api/media/${content.id}`} alt={content.title} />}
      {user.role !== "ADMIN" ? <details className="report-box"><summary>Denunciar conteúdo</summary><form action={reportContentAction} className="report-form"><input type="hidden" name="contentId" value={content.id}/><select name="reason" required defaultValue=""><option value="" disabled>Escolha o motivo</option><option value="UNDERAGE">Possível menor de idade</option><option value="NON_CONSENSUAL">Sem consentimento</option><option value="STOLEN">Conteúdo roubado</option><option value="VIOLENCE">Violência ou abuso</option><option value="ILLEGAL">Outro conteúdo ilegal</option><option value="SPAM">Spam ou fraude</option><option value="OTHER">Outro</option></select><textarea name="details" maxLength={1000} rows={3} placeholder="Explique com detalhes (obrigatório se escolher Outro)"/><button className="btn secondary">Enviar denúncia</button></form></details> : null}
    </article>)}
  </div>}{totalPages > 1 ? <nav className="pagination">{page > 1 ? <Link className="btn" href={`/feed?${filterQuery.toString()}${filterQuery.size ? "&" : ""}page=${page - 1}`}>← Anterior</Link> : <span/>}<span>Página {page} de {totalPages}</span>{page < totalPages ? <Link className="btn" href={`/feed?${filterQuery.toString()}${filterQuery.size ? "&" : ""}page=${page + 1}`}>Seguinte →</Link> : <span/>}</nav> : null}</main></>;
}
