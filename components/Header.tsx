import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/logout/actions";

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header>
      <Link className="logo" href="/">MOZ<span>PORN</span></Link>
      <nav>
        <Link href="/">Início</Link>
        <Link href="/creators">Criadores</Link>
        <Link href="/premium">Premium</Link>
        {user ? <Link href="/feed">Feed</Link> : null}
        {user ? <Link href="/dashboard">Painel</Link> : null}
      </nav>
      {user ? <form action={logoutAction}><button className="btn primary" type="submit">Sair</button></form> : <Link className="btn primary" href="/login">Entrar</Link>}
    </header>
  );
}
