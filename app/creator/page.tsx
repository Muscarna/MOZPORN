import Link from "next/link";

import Header from "@/components/Header";
import { requireCreator } from "@/lib/permissions";
import { db } from "@/lib/db";
import { money } from "@/lib/billing";

export default async function CreatorDashboard({ searchParams }: { searchParams: Promise<{ uploaded?: string }> }) {
  const user = await requireCreator();
  const params = await searchParams;
  const profile = await db.creatorProfile.findUnique({
    where: { userId: user.id },
    include: {
      _count: { select: { followers: true, contents: true } },
      contents: { orderBy: { createdAt: "desc" }, take: 20 },
      subscriptions: { where: { status: "ACTIVE" }, select: { id: true } },
      earnings: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!profile) return null;
  const availableMinor = profile.earnings.filter((item) => item.status === "AVAILABLE").reduce((sum, item) => sum + item.netAmountMinor, 0);
  const pendingMinor = profile.earnings.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + item.netAmountMinor, 0);

  return <><Header/><main><section className="page-title"><span className="badge">CREATOR</span><h1>Olá, {profile.displayName}</h1><p>@{profile.username}</p></section>
    {params.uploaded ? <div className="success-banner">Upload concluído. O conteúdo aguarda moderação.</div> : null}
    <div className="stats"><div><strong>{profile._count.followers}</strong><span>Seguidores</span></div><div><strong>{profile.subscriptions.length}</strong><span>Assinantes</span></div><div><strong>{money(availableMinor, "USD")}</strong><span>Disponível</span></div><div><strong>{money(pendingMinor, "USD")}</strong><span>Pendente</span></div></div>
    <div className="grid"><Link className="card" href="/creator/profile"><h2>Perfil</h2><p className="muted">Editar nome, biografia e visibilidade.</p></Link>{profile.status === "APPROVED" ? <Link className="card" href="/creator/upload"><h2>Publicar conteúdo</h2><p className="muted">Enviar foto ou vídeo para moderação.</p></Link> : <div className="card"><h2>Conteúdo bloqueado</h2><p className="muted">Aguarde a aprovação do perfil.</p></div>}<div className="card"><h2>Seguidores</h2><p className="muted">{profile._count.followers} seguidores.</p></div><div className="card"><h2>Monetização</h2><p className="muted">80% de cada pagamento elegível é atribuído ao criador, sujeito ao período de segurança e a estornos.</p></div></div>
    <section className="billing-section"><h2>Ganhos recentes</h2>{profile.earnings.length === 0 ? <p className="muted">Ainda não existem ganhos registados.</p> : <div className="billing-list">{profile.earnings.map((item) => <article key={item.id}><div><strong>{money(item.netAmountMinor, item.currency)}</strong><span>Criado em {item.createdAt.toLocaleDateString("pt-PT")}</span></div><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></article>)}</div>}</section>
    <section className="moderation-list"><h2>Minhas publicações</h2>{profile.contents.length === 0 ? <p className="muted">Ainda não publicou conteúdo.</p> : profile.contents.map((content) => <article className="moderation-card" key={content.id}><div><span className="badge">{content.status}</span><h3>{content.title}</h3>{content.rejectionReason ? <p className="error-text">{content.rejectionReason}</p> : null}</div>{content.mediaUrl ? content.mediaType === "VIDEO" ? <video className="moderation-media" src={`/api/media/${content.id}`} controls preload="metadata"/> : <img className="moderation-media" src={`/api/media/${content.id}`} alt={content.title}/> : null}</article>)}</section>
  </main></>;
}
