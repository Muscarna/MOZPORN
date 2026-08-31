import Link from "next/link";
import { logoutAction } from "./actions";

export default function LogoutPage() {
  return <main className="center-page"><div className="auth-card"><Link className="logo" href="/">MOZ<span>PORN</span></Link><h1>Terminar sessão</h1><p>Confirme para sair da sua conta.</p><form action={logoutAction}><button className="btn primary full" type="submit">Sair</button></form><Link className="back" href="/dashboard">Cancelar</Link></div></main>;
}
