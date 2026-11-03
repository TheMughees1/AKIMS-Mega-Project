"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight,ArrowUpRight,ShieldCheck,GraduationCap,FlaskConical,Wallet,LayoutDashboard,BookOpen,Users } from "lucide-react";
export default function Login({demo}:{demo:boolean}){
  const [busy,setBusy]=useState("");const [error,setError]=useState("");const router=useRouter();
  async function submit(payload:object,key:string){
    setBusy(key);setError("");
    try{const r=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const b=await r.json();if(!r.ok)throw new Error(b.error);router.push("/portal");router.refresh();}
    catch(e){setError((e as Error).message);setBusy("");}
  }
  const profiles=[["student","Student",GraduationCap],["staff","Lab & store",FlaskConical],["accounts","Accounts",Wallet],["admin","Admin",LayoutDashboard],["teacher","Faculty",BookOpen],["alumni","Alumni",Users]] as const;
  return <main id="main" className="login-page">
    <section className="login-story">
      <div className="brand inverse"><div className="brand-emblem"><GraduationCap size={28}/></div><div className="wordmark">AKIMS<span>AKBAR INSTITUTE OF MEDICAL SCIENCES</span></div></div>
      <div className="story-copy"><span className="eyebrow light">ONE CAMPUS. CONNECTED.</span><h1>Your campus.<br/>Your next chapter.</h1><p>Less paperwork. More possibility.<br/>A thoughtful space for your academic journey.</p><div className="story-rule"/><div className="story-feature"><ShieldCheck size={22}/><div><strong>A clearer path to clearance</strong><span>Apply, follow your progress, and receive your documents—all in one place.</span></div></div></div>
      <div className="campus-illustration" aria-hidden="true"><div className="building b1"/><div className="building b2"/><div className="building b3"/><div className="building b4"/><div className="campus-ground"/></div>
      <footer><span>Learning. Care. Community.</span><a href="https://akims.edu.pk/" target="_blank" rel="noreferrer">College website <ArrowUpRight size={14}/></a></footer>
    </section>
    <section className="login-form-panel">
      <div className="login-topnote">AKIMS CAMPUS PORTAL <span>•</span> WELCOME BACK</div>
      <div className="login-inner"><span className="eyebrow">YOUR CONNECTED CAMPUS</span><h2>A good place to begin.</h2><p className="muted">Sign in to your personal workspace.</p>
      <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void submit({action:"login",email:f.get("email"),password:f.get("password")},"login");}}>
        <label>Email address<input name="email" type="email" placeholder="Your institutional email" required autoComplete="username"/></label>
        <label>Password<input name="password" type="password" placeholder="Enter your password" required autoComplete="current-password"/></label>
        <button className="button primary wide" disabled={!!busy}>{busy==="login"?"Signing in…":"Sign in to your workspace"}<ArrowRight size={18}/></button>
      </form>
      {error&&<p role="alert" className="form-error">{error}</p>}
      {demo&&<div className="demo-access"><div className="divider-label">EXPLORE THE DEMONSTRATION</div><p>Choose a role. All people, records and charges are fictional.</p><div className="demo-grid">{profiles.map(([key,label,Icon])=><button key={key} disabled={!!busy} onClick={()=>submit({action:"demo",profile:key},key)}><Icon size={18}/><span>{busy===key?"Opening…":label}</span><ArrowUpRight size={14}/></button>)}</div></div>}
      <p className="login-help">Need an account or help signing in?<br/><strong>Contact your college administration.</strong></p>
      </div><div className="login-foot"><ShieldCheck size={14}/> Your records. Your privacy. Protected access.</div>
    </section>
  </main>;
}
