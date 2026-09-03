import Header from "@/components/Header";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/billing";
import { startCheckoutAction } from "@/app/billing/actions";
import { redeemAccessCodeAction } from "./actions";

export default async function PremiumPage({ searchParams }: { searchParams: Promise<{ billing?: string; code?: string }> }) {
  const [user, params, plans] = await Promise.all([getCurrentUser(), searchParams, db.plan.findMany({ where: { active: true, type: "PLATFORM_PREMIUM" }, orderBy: { amountMinor: "asc" } })]);
  const providerReady = Boolean(process.env.CCBILL_FLEXFORM_ID && process.env.CCBILL_PREMIUM_SUBSCRIPTION_TYPE_ID && process.env.CCBILL_WEBHOOK_SECRET);
  const active = user ? await db.subscription.findFirst({ where: { subscriberId: user.id, type: "PLATFORM_PREMIUM", status: "ACTIVE", currentPeriodEnd: { gt: new Date() } }, include: { plan: true }, orderBy: { currentPeriodEnd: "desc" } }) : null;
  return <><Header/><main className="page-shell"><section className="page-title"><span className="badge">PREMIUM 18+</span><h1>Conteúdo exclusivo, com acesso seguro</h1><p>Assinaturas recorrentes processadas fora da plataforma por um fornecedor especializado.</p></section>
    {params.billing === "provider-pending" || !providerReady ? <div className="billing-notice"><strong>Pagamentos ainda não disponíveis.</strong><p>A estrutura está pronta, mas as cobranças só serão ativadas depois da aprovação e configuração da conta comercial CCBill.</p></div> : null}
    {active ? <div className="success-banner">Plano {active.plan.name} ativo até {active.currentPeriodEnd?.toLocaleDateString("pt-PT")}.</div> : null}
    {params.code === "success" ? <div className="success-banner">Código aceite. O seu acesso Premium está ativo.</div> : null}
    {params.code && params.code !== "success" ? <div className="error-banner">Não foi possível usar esse código. Confirme se está correto, ativo e ainda disponível.</div> : null}
    {user && !active ? <section className="redeem-card"><h2>Tem um código de acesso?</h2><p className="muted">Use um código oferecido pela administração para ativar Premium gratuito por tempo limitado.</p><form action={redeemAccessCodeAction} className="redeem-form"><input name="code" minLength={6} maxLength={40} placeholder="EXEMPLO-2026" autoComplete="off" required/><button className="btn primary">Ativar código</button></form></section> : null}
    <div className="pricing billing-pricing">{plans.map((plan) => <article className="price-card popular" key={plan.id}><span>PLATAFORMA</span><h3>{plan.name}</h3><div className="price">{money(plan.amountMinor, plan.currency)} <small>/ {plan.billingDays} dias</small></div><p>{plan.description}</p><ul><li>Conteúdo Premium elegível</li><li>Pagamento alojado pelo fornecedor</li><li>Sem dados de cartão guardados aqui</li></ul>{active ? <button className="btn full" disabled>Plano ativo</button> : !user ? <Link className="btn primary full" href="/login">Entrar para assinar</Link> : <form action={startCheckoutAction}><input type="hidden" name="planCode" value={plan.code}/><button className="btn primary full" disabled={!providerReady}>Assinar</button></form>}</article>)}</div>
    <p className="legal-note">A subscrição não substitui a verificação de idade. Reembolsos, cancelamentos e estornos são sincronizados por notificações verificadas do fornecedor.</p>
  </main></>;
}
