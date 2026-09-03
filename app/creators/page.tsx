import Link from "next/link";
import Header from "@/components/Header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams; const q = (query.q ?? "").trim().slice(0, 80);
  const creators = await db.creatorProfile.findMany({ where: { status: "APPROVED", isPublic: true, ...(q ? { OR: [{ username: { contains: q, mode: "insensitive" } }, { displayName: { contains: q, mode: "insensitive" } }, { bio: { contains: q, mode: "insensitive" } }] } : {}) }, orderBy: { createdAt: "desc" }, take: 50, select: { username:true, displayName:true, bio:true, avatarUrl:true, _count:{select:{followers:true}} } });
  return <><Header /><main><section className="page-title"><span className="badge">CRIADORES VERIFICADOS</span><h1>Explore criadores</h1><p>Perfis e conteúdos exclusivos para membros maiores de 18 anos.</p></section><form className="filters" method="get"><input className="input" name="q" defaultValue={q} maxLength={80} placeholder="Pesquisar nome, username ou biografia"/><button className="btn primary">Pesquisar</button>{q ? <Link className="btn" href="/creators">Limpar</Link> : null}</form>{creators.length === 0 ? <div className="empty-state">Nenhum criador encontrado.</div> : <div className="creator-grid">{creators.map(c=><Link className="creator" key={c.username} href={`/creators/${c.username}`}><div className="avatar">{c.avatarUrl ? <img src={c.avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"✨"}</div><h3>{c.displayName}</h3><p>@{c.username}</p><p>{c.bio ?? "Criador aprovado na plataforma."}</p><div className="meta"><span>🔞 18+</span><span>{c._count.followers} seguidores</span></div></Link>)}</div>}</main><footer>© 2026 MOZPORN • 18+</footer></>;
}
