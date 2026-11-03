import { pool } from "@/lib/db";
import { ShieldCheck,ShieldX } from "lucide-react";
export const dynamic="force-dynamic";
export default async function Verify({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const certificate=/^[a-f0-9]{48}$/.test(token)?(await pool.query("SELECT number,status,issued_at FROM certificates WHERE token=$1",[token])).rows[0]:null;
  const valid=certificate?.status==="active";
  return <main id="main" className="verification-page"><div className="verification-card"><div className="wordmark">AKIMS<span>CAMPUS</span></div>{valid?<ShieldCheck size={48}/>:<ShieldX size={48}/>}<h1>{valid?"Clearance verified":certificate?"Certificate revoked":"Record not found"}</h1><p>{valid?"This clearance record is active. It confirms departmental clearance, not an academic qualification.":certificate?"This record is no longer valid. Contact the institution for assistance.":"Check the verification reference on your document."}</p>{certificate&&<p>CL-{String(certificate.number).padStart(5,"0")} · Issued {new Date(certificate.issued_at).toLocaleDateString("en-GB")}</p>}<small>Only verification status is shared. Student records and financial information remain private.</small></div></main>;
}
