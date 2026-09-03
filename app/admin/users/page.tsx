import Header from "@/components/Header";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { updateAccountStatusAction } from "../actions";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const admin = await requireAdmin(); const query = await searchParams;
  const users = await db.user.findMany({ where: { id: { not: admin.id } }, select: { id: true, email: true, name: true, role: true, status: true, suspensionReason: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return <><Header/><main><section className="page-title"><span className="badge">SEGURANÇA</span><h1>Contas de utilizadores</h1><p>Suspensões impedem imediatamente o acesso à plataforma.</p></section>{query.error ? <div className="error-banner">Indique um motivo com pelo menos 5 caracteres.</div> : null}<section className="moderation-list">{users.map((user) => <article className="moderation-card" key={user.id}><div><span className="badge">{user.status}</span><h3>{user.name || user.email}</h3><p className="muted">{user.email} · {user.role} · desde {user.createdAt.toLocaleDateString("pt-PT")}</p>{user.suspensionReason ? <p className="error-text">Motivo: {user.suspensionReason}</p> : null}</div><form action={updateAccountStatusAction} className="moderation-actions"><input type="hidden" name="userId" value={user.id}/>{user.status === "ACTIVE" ? <><input name="reason" maxLength={500} placeholder="Motivo obrigatório" required/><button name="decision" value="SUSPEND" className="btn danger">Suspender</button></> : <button name="decision" value="REACTIVATE" className="btn primary">Reativar</button>}</form></article>)}</section></main></>;
}
