import Link from "next/link";
import Header from "@/components/Header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  const creators = await db.creatorProfile.findMany({ where: { status: "APPROVED", isPublic: true }, orderBy: { createdAt: "desc" }, take: 50, select: { username:true, displayName:true, bio:true, avatarUrl:true, _count:{select:{followers:true}} } });
  return <><Header /><main><section className="page-title"><span className="badge">CRIADORES VERIFICADOS</span><h1>Explore criadores</h1><p>Perfis e conteúdos exclusivos para membros maiores de 18 anos.</p></section><div className="filters"><input className="input" placeholder="A pesquisa será ligada ao backend na próxima iteração." disabled /></div><div className="creator-grid">{creators.map(c=><Link className="creator" key={c.username} href={`/creators/${c.username}`}><div className="avatar">{c.avatarUrl ? <img src={c.avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"✨"}</div><h3>{c.displayName}</h3><p>@{c.username}</p><p>{c.bio ?? "Criador aprovado na plataforma."}</p><div className="meta"><span>🔞 18+</span><span>{c._count.followers} seguidores</span></div></Link>)}</div></main><footer>© 2026 MOZPORN • 18+</footer></>;
}
