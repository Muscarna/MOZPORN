import Header from "@/components/Header";
import { requireAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { moderateContentAction, moderateReportAction } from "../actions";

export default async function ContentModerationPage() {
  await requireAdmin();
  const [contents, reports] = await Promise.all([
    db.content.findMany({
      where: { status: { in: ["PENDING_REVIEW", "APPROVED", "REJECTED"] } },
      include: { creator: { select: { username: true, displayName: true } }, _count: { select: { reports: true } } },
      orderBy: { createdAt: "desc" }, take: 100,
    }),
    db.contentReport.findMany({
      where: { status: "OPEN" },
      include: { reporter: { select: { email: true } }, content: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" }, take: 100,
    }),
  ]);

  return <><Header/><main><section className="page-title"><span className="badge">MODERAÇÃO</span><h1>Conteúdos e denúncias</h1><p>Apenas conteúdos aprovados aparecem no feed.</p></section>
    <section className="moderation-list"><h2>Publicações</h2>{contents.length === 0 ? <p className="muted">Nenhuma publicação enviada.</p> : contents.map((content) => <article className="moderation-card" key={content.id}>
      <div><span className="badge">{content.status}</span><h3>{content.title}</h3><p className="muted">@{content.creator.username} · {content._count.reports} denúncia(s)</p></div>
      {content.mediaUrl ? content.mediaType === "VIDEO" ? <video className="moderation-media" src={`/api/media/${content.id}`} controls preload="metadata"/> : <img className="moderation-media" src={`/api/media/${content.id}`} alt={content.title}/> : null}
      <form action={moderateContentAction} className="moderation-actions"><input type="hidden" name="contentId" value={content.id}/><input name="reason" maxLength={500} placeholder="Motivo, se rejeitar ou remover"/><button name="decision" value="APPROVED" className="btn primary">Aprovar</button><button name="decision" value="REJECTED" className="btn secondary">Rejeitar</button><button name="decision" value="REMOVED" className="btn danger">Remover</button></form>
    </article>)}</section>
    <section className="moderation-list"><h2>Denúncias abertas</h2>{reports.length === 0 ? <p className="muted">Nenhuma denúncia aberta.</p> : reports.map((report) => <article className="moderation-card" key={report.id}><div><h3>{report.content.title}</h3><p>{report.reason}</p><p className="muted">Enviada por {report.reporter.email}</p></div><form action={moderateReportAction} className="moderation-actions"><input type="hidden" name="reportId" value={report.id}/><button name="decision" value="DISMISSED" className="btn secondary">Arquivar</button><button name="decision" value="ACTIONED" className="btn primary">Resolvida</button></form></article>)}</section>
  </main></>;
}
