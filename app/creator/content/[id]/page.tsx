import Link from "next/link";
import { notFound } from "next/navigation";
import ContentDeleteButton from "@/components/ContentDeleteButton";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/permissions";
import { updateContentAction } from "../actions";

export default async function EditContentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const user = await requireCreator(); const { id } = await params; const query = await searchParams;
  const content = await db.content.findFirst({ where: { id, creator: { userId: user.id } }, include: { attestation: true } });
  if (!content) notFound();
  return <main className="center-page"><section className="auth-card wide-card"><Link className="logo" href="/">MOZ<span>PORN</span></Link><h1>Gerir publicação</h1><p>Estado: <span className="badge">{content.status}</span></p>{query.success ? <div className="success-banner">Alterações guardadas e enviadas para nova moderação.</div> : null}{query.error ? <div className="error-banner">Confirme os dados introduzidos.</div> : null}
    <form className="form" action={updateContentAction}><input type="hidden" name="contentId" value={content.id}/><label>Título<input name="title" defaultValue={content.title} minLength={3} maxLength={100} required/></label><label>Descrição<textarea name="description" defaultValue={content.description ?? ""} maxLength={2000} rows={5}/></label><label>Visibilidade<select name="visibility" defaultValue={content.visibility}><option value="PUBLIC">Público para membros</option><option value="FOLLOWERS">Seguidores</option><option value="SUBSCRIBERS">Assinantes e Premium</option><option value="PRIVATE">Privado</option></select></label><button className="btn primary full">Guardar e reenviar</button></form>
    <div className="attestation-summary"><h2>Declaração da publicação</h2>{content.attestation ? <p>Registada em {content.attestation.declaredAt.toLocaleDateString("pt-PT")} · versão {content.attestation.declarationVersion}</p> : <p className="error-text">Esta publicação antiga não possui declaração registada e não poderá ser aprovada novamente.</p>}</div><ContentDeleteButton contentId={content.id}/><Link className="back" href="/creator">← Voltar ao painel</Link></section></main>;
}
