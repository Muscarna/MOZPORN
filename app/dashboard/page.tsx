import Link from "next/link";
import Header from "@/components/Header";
import { requireUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { money } from "@/lib/billing";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{verification?:string;subscription?:string}> }) {
  const user = await requireUser(); const params = await searchParams;
  const [subscriptions, payments] = await Promise.all([
    db.subscription.findMany({ where: { subscriberId: user.id }, include: { plan: true, creator: { select: { username: true, displayName: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const profile = user.creatorProfile;
  const activeCount = subscriptions.filter((item) => item.status === "ACTIVE" && (!item.currentPeriodEnd || item.currentPeriodEnd > new Date())).length;
  return <><Header/><main><section className="page-title"><span className="badge">PAINEL</span><h1>Olá, {user.name ?? "Membro"}</h1><p>{user.email}</p></section>
    {params.verification === "submitted" ? <div className="success-banner">Candidatura enviada para análise.</div>:null}{params.subscription === "active" ? <div className="success-banner">A assinatura já está ativa.</div> : null}
    <div className="stats"><div><strong>{profile ? profile.status : "USER"}</strong><span>Perfil</span></div><div><strong>{activeCount}</strong><span>Assinaturas ativas</span></div><div><strong>{payments.filter((item) => item.status === "SUCCEEDED").length}</strong><span>Pagamentos</span></div><div><strong>Ativo</strong><span>Estado</span></div></div>
    <div className="grid"><div className="card"><h2>Minha conta</h2><p className="muted">Gerencie a sua conta e acompanhe a atividade.</p></div>{user.role === "USER" && !profile ? <div className="card"><h2>Tornar-me Creator</h2><p className="muted">Envie uma candidatura para análise administrativa.</p><Link className="btn primary" href="/creator/apply">Candidatar-me</Link></div>:null}{profile ? <div className="card"><h2>Candidatura de Creator</h2><p>Estado: <span className="badge">{profile.status}</span></p>{profile.status === "APPROVED" ? <Link className="btn primary" href="/creator">Abrir área Creator</Link>:null}</div>:null}<Link className="card" href="/premium"><h2>Premium</h2><p className="muted">Ver os planos disponíveis.</p></Link></div>
    <section className="billing-section"><h2>Minhas assinaturas</h2>{subscriptions.length === 0 ? <p className="muted">Ainda não tem assinaturas.</p> : <div className="billing-list">{subscriptions.map((item) => <article key={item.id}><div><strong>{item.creator?.displayName ?? item.plan.name}</strong><span>{item.creator ? `@${item.creator.username}` : item.plan.description}</span></div><div><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span><strong>{item.provider === "MANUAL" ? "Acesso gratuito" : money(item.plan.amountMinor, item.plan.currency)}</strong></div></article>)}</div>}</section>
  </main></>;
}
