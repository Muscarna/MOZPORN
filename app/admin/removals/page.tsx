import Header from "@/components/Header";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { decideRemovalRequestAction } from "./actions";

export default async function AdminRemovalsPage() {
  await requireAdmin();
  const requests = await db.removalRequest.findMany({ where: { status: { in: ["OPEN", "REVIEWING"] } }, include: { content: { select: { id: true, title: true, status: true } } }, orderBy: [{ reason: "asc" }, { createdAt: "asc" }], take: 100 });
  return <><Header/><main><section className="page-title"><span className="badge">PROTEÇÃO</span><h1>Pedidos de remoção</h1><p>Analise primeiro possíveis menores e conteúdo não consentido.</p></section><section className="moderation-list">{requests.length === 0 ? <p className="muted">Nenhum pedido pendente.</p> : requests.map((request) => <article className="moderation-card" key={request.id}><div><span className="badge">{request.reason}</span><h3>Referência {request.reference}</h3><p><strong>Conteúdo:</strong> {request.content?.title || request.contentRef}</p><p><strong>Solicitante:</strong> {request.requesterName} ({request.requesterEmail})</p><p><strong>Relação:</strong> {request.relationship}</p><p>{request.details}</p><p className="muted">Estado: {request.status} · recebido em {request.createdAt.toLocaleString("pt-PT")}</p></div><form action={decideRemovalRequestAction} className="moderation-actions"><input type="hidden" name="requestId" value={request.id}/><input name="adminNotes" maxLength={2000} placeholder="Notas da decisão"/><button name="decision" value="REVIEWING" className="btn secondary">Em análise</button><button name="decision" value="REJECTED" className="btn secondary">Rejeitar</button><button name="decision" value="ACTIONED" className="btn danger">Remover e concluir</button></form></article>)}</section></main></>;
}
