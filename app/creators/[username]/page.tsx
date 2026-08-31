import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import CreatorFollowButton from "@/components/CreatorFollowButton";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function PublicCreatorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const creator = await db.creatorProfile.findFirst({ where:{username: username.toLowerCase(), status:"APPROVED", isPublic:true}, select:{id:true,userId:true,username:true,displayName:true,bio:true,avatarUrl:true,_count:{select:{followers:true}}} });
  if (!creator) notFound();
  const user = await getCurrentUser();
  const isFollowing = user ? Boolean(await db.creatorFollow.findUnique({ where:{ followerId_creatorId:{followerId:user.id,creatorId:creator.id} } })) : false;
  return <><Header /><main><section className="creator-profile"><div className="creator-header"><div className="large-avatar">{creator.avatarUrl ? <img src={creator.avatarUrl} alt={creator.displayName}/> : <span>{creator.displayName.charAt(0).toUpperCase()}</span>}</div><div><div className="verified-line"><h1>{creator.displayName}</h1><span className="badge">✓ Verificado</span></div><p className="muted">@{creator.username}</p><p className="muted">{creator._count.followers} seguidores</p>{user && user.id !== creator.userId ? <CreatorFollowButton creatorId={creator.id} isFollowing={isFollowing}/> : null}</div></div><div className="card"><h2>Sobre</h2><p className="muted">{creator.bio ?? "Este criador ainda não adicionou uma biografia."}</p></div><div className="card"><h2>Conteúdo</h2><p className="muted">A área de conteúdos será ativada depois da implementação de moderação e armazenamento seguro.</p><div className="empty-state">Nenhum conteúdo publicado.</div></div><div className="card"><h2>Apoiar este criador</h2><p className="muted">As assinaturas serão integradas numa etapa posterior com fornecedores de pagamento compatíveis.</p></div><Link href="/creators" className="btn">← Voltar</Link></section></main></>;
}
