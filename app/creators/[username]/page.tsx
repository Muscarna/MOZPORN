import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import CreatorFollowButton from "@/components/CreatorFollowButton";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { money, hasCreatorSubscription, hasPremiumAccess } from "@/lib/billing";
import { startCheckoutAction } from "@/app/billing/actions";
import { toggleCreatorBlockAction, toggleFavoriteAction } from "@/app/feed/personal-actions";

export default async function PublicCreatorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const creator = await db.creatorProfile.findFirst({ where:{username: username.toLowerCase(), status:"APPROVED", isPublic:true}, include:{_count:{select:{followers:true,subscriptions:{where:{status:"ACTIVE"}}}},contents:{where:{status:"APPROVED",mediaUrl:{not:null}},orderBy:{createdAt:"desc"},take:20}} });
  if (!creator) notFound();
  const user = await getCurrentUser();
  const [isFollowing, creatorPlan, subscriberAccess, premiumAccess, isBlocked, favorites] = await Promise.all([
    user ? db.creatorFollow.findUnique({ where:{ followerId_creatorId:{followerId:user.id,creatorId:creator.id} } }).then(Boolean) : false,
    db.plan.findFirst({ where: { code: "CREATOR_MONTHLY", active: true } }),
    user ? hasCreatorSubscription(user.id, creator.id) : false,
    user ? hasPremiumAccess(user.id) : false,
    user ? db.creatorBlock.findUnique({ where: { userId_creatorId: { userId: user.id, creatorId: creator.id } } }).then(Boolean) : false,
    user ? db.contentFavorite.findMany({ where: { userId: user.id, content: { creatorId: creator.id } }, select: { contentId: true } }) : [],
  ]);
  const providerReady = Boolean(process.env.CCBILL_FLEXFORM_ID && process.env.CCBILL_CREATOR_SUBSCRIPTION_TYPE_ID && process.env.CCBILL_WEBHOOK_SECRET);
  const favoriteIds = new Set(favorites.map((item) => item.contentId));
  const visible = isBlocked ? [] : creator.contents.filter((content) => content.visibility === "PUBLIC" || content.visibility === "FOLLOWERS" && isFollowing || content.visibility === "SUBSCRIBERS" && (subscriberAccess || premiumAccess) || user?.id === creator.userId || user?.role === "ADMIN");
  return <><Header /><main><section className="creator-profile"><div className="creator-header"><div className="large-avatar">{creator.avatarUrl ? <img src={creator.avatarUrl} alt={creator.displayName}/> : <span>{creator.displayName.charAt(0).toUpperCase()}</span>}</div><div><div className="verified-line"><h1>{creator.displayName}</h1><span className="badge">✓ Verificado</span></div><p className="muted">@{creator.username}</p><p className="muted">{creator._count.followers} seguidores · {creator._count.subscriptions} assinantes</p>{user && user.id !== creator.userId ? <CreatorFollowButton creatorId={creator.id} isFollowing={isFollowing}/> : null}</div></div>
    <div className="card"><h2>Sobre</h2><p className="muted">{creator.bio ?? "Este criador ainda não adicionou uma biografia."}</p>{user && user.id !== creator.userId ? <form action={toggleCreatorBlockAction}><input type="hidden" name="creatorId" value={creator.id}/><button className="btn danger">{isBlocked ? "Desbloquear criador" : "Bloquear criador"}</button></form> : null}</div>
    <div className="card"><h2>Conteúdo</h2>{visible.length === 0 ? <div className="empty-state">{isBlocked ? "Este criador está bloqueado." : "Nenhum conteúdo disponível para o seu nível de acesso."}</div> : <div className="creator-content-grid">{visible.map((content) => <article key={content.id}><span className="badge">{content.visibility}</span><h3>{content.title}</h3>{content.mediaType === "VIDEO" ? <video className="content-media" src={`/api/media/${content.id}`} controls preload="metadata"/> : <img className="content-media" src={`/api/media/${content.id}`} alt={content.title}/>}<form action={toggleFavoriteAction}><input type="hidden" name="contentId" value={content.id}/><input type="hidden" name="returnTo" value={`/creators/${creator.username}`}/><button className="btn secondary">{favoriteIds.has(content.id) ? "★ Favorito" : "☆ Guardar"}</button></form></article>)}</div>}</div>
    {user?.id !== creator.userId && creatorPlan ? <div className="card support-card"><div><h2>Apoiar este criador</h2><p className="muted">{subscriberAccess ? "A sua assinatura está ativa." : `Acesso mensal ao conteúdo exclusivo por ${money(creatorPlan.amountMinor, creatorPlan.currency)}.`}</p></div>{subscriberAccess ? <button className="btn" disabled>Assinante ativo</button> : <form action={startCheckoutAction}><input type="hidden" name="planCode" value={creatorPlan.code}/><input type="hidden" name="creatorId" value={creator.id}/><button className="btn primary" disabled={!providerReady}>{providerReady ? "Assinar" : "Em breve"}</button></form>}</div> : null}
    <Link href="/creators" className="btn">← Voltar</Link></section></main></>;
}
