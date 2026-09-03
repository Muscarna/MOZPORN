import Link from "next/link";
import Header from "@/components/Header";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { hasCreatorSubscription, hasPremiumAccess } from "@/lib/billing";
import { toggleFavoriteAction } from "@/app/feed/personal-actions";

export default async function FavoritesPage() {
  const user = await requireUser();
  const [favorites, premium] = await Promise.all([db.contentFavorite.findMany({ where: { userId: user.id, content: { status: "APPROVED", mediaUrl: { not: null }, creator: { blockedBy: { none: { userId: user.id } } } } }, include: { content: { include: { creator: { select: { username: true, displayName: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 }), hasPremiumAccess(user.id)]);
  const accessible = (await Promise.all(favorites.map(async ({ content }) => content.visibility === "PUBLIC" || content.visibility === "FOLLOWERS" && Boolean(await db.creatorFollow.findUnique({ where: { followerId_creatorId: { followerId: user.id, creatorId: content.creatorId } } })) || content.visibility === "SUBSCRIBERS" && (premium || await hasCreatorSubscription(user.id, content.creatorId)) ? content : null))).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return <><Header/><main><section className="page-title"><span className="badge">FAVORITOS</span><h1>Conteúdo guardado</h1><p>Só você pode consultar esta lista.</p></section>{accessible.length === 0 ? <div className="empty-state"><h2>Nenhum favorito</h2><p>Guarde publicações a partir do feed.</p><Link className="btn primary" href="/feed">Abrir feed</Link></div> : <div className="content-feed">{accessible.map((content) => <article className="content-card" key={content.id}><div className="content-meta"><Link href={`/creators/${content.creator.username}`}>@{content.creator.username}</Link><span>{content.createdAt.toLocaleDateString("pt-PT")}</span></div><h2>{content.title}</h2>{content.description ? <p>{content.description}</p> : null}{content.mediaType === "VIDEO" ? <video className="content-media" src={`/api/media/${content.id}`} controls preload="metadata"/> : <img className="content-media" src={`/api/media/${content.id}`} alt={content.title}/>}<form action={toggleFavoriteAction} className="favorite-form"><input type="hidden" name="contentId" value={content.id}/><input type="hidden" name="returnTo" value="/favorites"/><button className="btn secondary">★ Remover dos favoritos</button></form></article>)}</div>}</main></>;
}
