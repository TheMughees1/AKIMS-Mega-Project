"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="verification-page"><div className="verification-card"><h1>We couldn’t load this page.</h1><p>Your saved records are still there. Please try again.</p><button className="button primary" onClick={reset}>Try again</button></div></main>;}
