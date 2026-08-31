import Link from "next/link";
import { forgotPasswordAction } from "./actions";

export default function ForgotPasswordPage(){return <main className="center-page"><div className="auth-card"><Link className="logo" href="/">MOZ<span>PORN</span></Link><h1>Recuperar acesso</h1><p>Informe o email da sua conta.</p><form className="form" action={forgotPasswordAction}><label>Email<input name="email" type="email" required/></label><button className="btn primary full">Enviar instruções</button></form><p className="small">No ambiente local, o link de recuperação aparece no terminal do servidor.</p><Link className="back" href="/login">← Voltar ao login</Link></div></main>}
