import Link from "next/link";
import { resetPasswordAction } from "./actions";

export default async function ResetPasswordPage({searchParams}:{searchParams:Promise<{token?:string}>}){const p=await searchParams;return <main className="center-page"><div className="auth-card"><Link className="logo" href="/">MOZ<span>PORN</span></Link><h1>Nova palavra-passe</h1><form className="form" action={resetPasswordAction}><input type="hidden" name="token" value={p.token??""}/><label>Nova palavra-passe<input name="password" type="password" minLength={8} required/></label><button className="btn primary full">Alterar palavra-passe</button></form></div></main>}
