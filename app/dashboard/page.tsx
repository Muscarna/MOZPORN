import Link from "next/link";
import Header from "@/components/Header";
import { requireUser } from "@/lib/permissions";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{verification?:string}> }) {
  const user = await requireUser(); const p=await searchParams; const profile=user.creatorProfile;
  return <><Header/><main><section className="page-title"><span className="badge">PAINEL</span><h1>Olá, {user.name ?? "Membro"}</h1><p>{user.email}</p></section>{p.verification === "submitted" ? <div className="success">Candidatura enviada para análise.</div>:null}<div className="stats"><div><strong>{profile ? profile.status : "USER"}</strong><span>Perfil</span></div><div><strong>{profile ? "0" : "—"}</strong><span>Assinaturas</span></div><div><strong>0</strong><span>Favoritos</span></div><div><strong>Ativo</strong><span>Estado</span></div></div><div className="grid"><div className="card"><h2>Minha conta</h2><p className="muted">Gerencie a sua conta e acompanhe a atividade.</p></div>{user.role === "USER" && !profile ? <div className="card"><h2>Tornar-me Creator</h2><p className="muted">Envie uma candidatura para análise administrativa.</p><Link className="btn primary" href="/creator/apply">Candidatar-me</Link></div>:null}{profile ? <div className="card"><h2>Candidatura de Creator</h2><p>Estado: <span className="badge">{profile.status}</span></p>{profile.status === "APPROVED" ? <Link className="btn primary" href="/creator">Abrir área Creator</Link>:null}</div>:null}</div></main></>;
}
