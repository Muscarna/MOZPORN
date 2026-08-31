import Link from "next/link";
import { redirect } from "next/navigation";

import ContentUploadForm from "@/components/ContentUploadForm";
import { getCurrentUser } from "@/lib/auth";

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CREATOR" || user.creatorProfile?.status !== "APPROVED") redirect("/dashboard");

  return <main className="center-page"><section className="auth-card wide-card">
    <Link className="logo" href="/">MOZ<span>PORN</span></Link>
    <h1>Nova publicação</h1>
    <p>O conteúdo será privado até aprovação da moderação.</p>
    <ContentUploadForm />
    <Link className="back" href="/creator">← Voltar ao painel</Link>
  </section></main>;
}
