import { getCurrentUser } from '../lib/session';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default async function LoginPage({searchParams}){
  const sp=await searchParams;
  const rawNext=String(sp?.next||'');
  const next=rawNext.startsWith('/')&&!rawNext.startsWith('//')?rawNext:'/dashboard';
  const u=await getCurrentUser(); if(u) redirect(next);
  const error=sp?.error;
  return <div className="login"><section className="loginVisual"><img src="/img/logo-dark.png" alt="OTE"/><h1>Parts, inventory and service — without the cabinet guesswork.</h1><p>Omaha Track internal equipment system.</p></section><section className="loginPanel"><img src="/img/logo-light.png" alt="OTE"/><h2>Welcome back</h2><p className="muted">Sign in with your username or email.</p>{error?<div className="error">{error==='inactive'?'This account is inactive. Contact an administrator.':'Invalid username/email or password.'}</div>:null}<form action="/api/auth/login" method="post"><input type="hidden" name="next" value={next}/><div className="field"><label>Username or Email</label><input name="login" autoFocus required autoComplete="username"/></div><div className="field" style={{marginTop:14}}><label>Password</label><input name="password" type="password" required autoComplete="current-password"/></div><button className="btn primary" style={{width:'100%',marginTop:18}}>Log In</button></form><a className="textLink loginHelp" href="/forgot-password">Forgot password?</a></section></div>
}
