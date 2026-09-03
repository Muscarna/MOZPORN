import Header from "@/components/Header";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export default async function AdminAuditPage() {
  await requireAdmin();
  const logs = await db.adminAuditLog.findMany({ include: { admin: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return <><Header/><main><section className="page-title"><span className="badge">AUDITORIA</span><h1>Histórico administrativo</h1><p>Registo das 200 decisões mais recentes.</p></section><div className="table-wrap"><table className="table"><thead><tr><th>Data</th><th>Ação</th><th>Administrador</th><th>Alvo</th><th>Detalhes</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{log.createdAt.toLocaleString("pt-PT")}</td><td>{log.action}</td><td>{log.admin.email}</td><td>{log.targetType || "—"} {log.targetId || ""}</td><td>{log.details || "—"}</td></tr>)}</tbody></table></div></main></>;
}
