import Header from "@/components/Header";
import { money } from "@/lib/billing";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export default async function AdminBillingPage() {
  await requireAdmin();
  const [subscriptions, payments, earnings] = await Promise.all([
    db.subscription.findMany({ include: { subscriber: { select: { email: true } }, creator: { select: { displayName: true } }, plan: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.creatorEarning.findMany({ include: { creator: { select: { displayName: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const gross = payments.filter((item) => item.status === "SUCCEEDED").reduce((sum, item) => sum + item.amountMinor, 0);
  const creatorNet = earnings.filter((item) => item.status !== "REVERSED").reduce((sum, item) => sum + item.netAmountMinor, 0);
  return <><Header/><main className="page-shell"><section className="page-title"><span className="badge">ADMIN · FATURAÇÃO</span><h1>Assinaturas e pagamentos</h1><p>Registos recebidos do fornecedor. Nenhum dado de cartão é armazenado.</p></section>
    <div className="stats"><div><strong>{subscriptions.filter((item) => item.status === "ACTIVE").length}</strong><span>Assinaturas ativas</span></div><div><strong>{payments.filter((item) => item.status === "SUCCEEDED").length}</strong><span>Pagamentos concluídos</span></div><div><strong>{money(gross, "USD")}</strong><span>Volume bruto</span></div><div><strong>{money(creatorNet, "USD")}</strong><span>Atribuído a criadores</span></div></div>
    <section className="billing-section"><h2>Assinaturas recentes</h2>{subscriptions.length === 0 ? <p className="muted">Sem assinaturas.</p> : <div className="billing-list">{subscriptions.map((item) => <article key={item.id}><div><strong>{item.subscriber.email}</strong><span>{item.creator?.displayName ?? item.plan.name}</span></div><div><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span><strong>{money(item.plan.amountMinor, item.plan.currency)}</strong></div></article>)}</div>}</section>
    <section className="billing-section"><h2>Ganhos de criadores</h2>{earnings.length === 0 ? <p className="muted">Sem ganhos registados.</p> : <div className="billing-list">{earnings.map((item) => <article key={item.id}><div><strong>{item.creator.displayName}</strong><span>Bruto {money(item.grossAmountMinor, item.currency)} · taxa {money(item.platformFeeMinor, item.currency)}</span></div><div><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span><strong>{money(item.netAmountMinor, item.currency)}</strong></div></article>)}</div>}</section>
  </main></>;
}
