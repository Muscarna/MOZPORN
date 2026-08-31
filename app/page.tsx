import Link from "next/link";
import Header from "@/components/Header";
import AgeGate from "@/components/AgeGate";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const creators = await db.creatorProfile.findMany({
    where: { status: "APPROVED", isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { username: true, displayName: true, bio: true, avatarUrl: true, _count: { select: { followers: true } } },
  });
  return <>
    <AgeGate />
    <Header />
    <main>
      <section className="hero">
        <div><span className="badge">🔞 EXCLUSIVO 18+</span><h1>Descubra conteúdo.<br /><em>Apoie criadores.</em></h1><p>Uma experiência premium para maiores de 18 anos, com criadores verificados e conteúdos exclusivos.</p><div className="hero-actions"><Link className="btn primary" href="/creators">Explorar criadores</Link><Link className="btn" href="/premium">Conhecer Premium</Link></div></div>
        <div className="hero-card"><div className="mini">⭐ Área Premium</div><h3>Conteúdo exclusivo</h3><p>Assine criadores, desbloqueie publicações e acompanhe as novidades.</p><Link href="/premium">Ver planos →</Link></div>
      </section>
      <section><div className="section-head"><h2>Criadores em destaque</h2><Link href="/creators">Ver todos →</Link></div><div className="creator-grid">{creators.map(c => <Link className="creator" href={`/creators/${c.username}`} key={c.username}><div className="avatar">{c.avatarUrl ? <img src={c.avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : "✨"}</div><h3>{c.displayName}</h3><p>@{c.username}</p><div className="meta"><span>🔞 18+</span><span>{c._count.followers} seguidores</span></div></Link>)}</div></section>
      <section className="notice"><h2>Uma plataforma responsável</h2><p>Somente adultos, consentimento, respeito pela privacidade e mecanismos de denúncia. Conteúdo não consensual e material envolvendo menores são proibidos.</p></section>
    </main>
    <footer>© 2026 MOZPORN • 18+ • <Link href="/terms">Termos</Link> • <Link href="/privacy">Privacidade</Link></footer>
  </>;
}
