"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload,ArrowRight,CheckCircle2,ArrowDownToLine,FileSpreadsheet } from "lucide-react";
import { parseCSV,csvCell } from "@/lib/csv";
const fields=[["studentNumber","Student identifier"],["name","Full name"],["email","Email address"],["program","Program code"],["batch","Batch / session"],["semester","Semester"]] as const;
export default function ImportWizard({programs,batches}:{programs:any[];batches:any[]}){
  const [step,setStep]=useState(1);const [rows,setRows]=useState<string[][]>([]);
  const [filename,setFilename]=useState("");const [mapping,setMapping]=useState<Record<string,string>>({});
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [preview,setPreview]=useState<any>(null);const [result,setResult]=useState<any>(null);
  const router=useRouter();
  async function load(file?:File){
    setError("");if(!file)return;
    try{if(!file.name.toLowerCase().endsWith(".csv"))throw new Error("Export the spreadsheet as CSV UTF-8 first.");if(file.size>1024*1024)throw new Error("Choose a CSV smaller than 1 MB.");setRows(parseCSV(await file.text()));setFilename(file.name);setMapping({});setStep(2);}catch(e){setError((e as Error).message);}
  }
  async function run(mode:"preview"|"commit"){
    setBusy(true);setError("");
    try{
      const r=await fetch("/api/imports",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,rows:rows.slice(1),mapping})});
      const b=await r.json();if(!r.ok)throw new Error(b.error);
      if(mode==="preview"){setPreview(b);setStep(3);}else{setResult(b);setStep(4);router.refresh();}
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  function downloadErrors(){
    const content=[["Source row","Errors"].map(csvCell).join(","),...preview.results.filter((r:any)=>r.errors.length).map((r:any)=>[r.row,r.errors.join("; ")].map(csvCell).join(","))].join("\r\n");
    const url=URL.createObjectURL(new Blob([content],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download="AKIMS-import-errors.csv";a.click();URL.revokeObjectURL(url);
  }
  return <><div className="import-steps">{["Choose file","Map columns","Review","Import"].map((label,i)=><div key={label} className={"import-step "+(step===i+1?"active":"")}><span>{i+1<step?"✓":i+1}</span>{label}</div>)}</div><section className="panel compact">
    {step===1&&<><h2>Start with your source records</h2><div className="import-drop"><FileSpreadsheet size={36}/><h3>Choose a student spreadsheet export</h3><p>This first release accepts CSV UTF-8 exported from Excel. Original Word files, scanned forms and direct XLSX imports need a separate reviewed migration.</p><input aria-label="Choose student CSV" type="file" accept=".csv,text/csv" onChange={e=>load(e.target.files?.[0])}/></div><p className="muted small">Up to 1,000 rows and 1 MB per batch. Keep the original file. We will ask you to map its columns before any records are saved.</p></>}
    {step===2&&<><h2>Tell us what each column means</h2><p className="muted small">{filename} · {rows.length-1} source rows. No mappings are assumed.</p>{fields.map(([key,label])=><div className="mapping-row" key={key}><strong>{label}</strong><ArrowRight size={15}/><label><span className="sr-only">Source column for {label}</span><select value={mapping[key]??""} onChange={e=>setMapping({...mapping,[key]:e.target.value})}><option value="">Choose source column</option>{rows[0].map((header,index)=><option value={index} key={index}>{header||"Column "+(index+1)}</option>)}</select></label></div>)}<div className="inline-note">Available program codes: {programs.map(p=>p.id+" ("+p.abbreviation+")").join(", ")}. Resolve unfamiliar programs with administration before import.</div><div className="import-actions"><button className="button secondary" onClick={()=>setStep(1)}>Choose another file</button><button className="button primary" disabled={busy||fields.some(([key])=>mapping[key]===undefined||mapping[key]==="")} onClick={()=>run("preview")}>{busy?"Validating…":"Validate & preview"}<ArrowRight size={16}/></button></div></>}
    {step===3&&preview&&<><h2>Review before anything is saved</h2><div className="import-summary"><div><strong>{preview.total}</strong><span>Source rows</span></div><div><strong>{preview.valid}</strong><span>Valid new students</span></div><div><strong>{preview.invalid}</strong><span>Rows needing correction</span></div></div><div className="table-wrap"><table><thead><tr><th>Source row</th><th>Student</th><th>Identifier</th><th>Result</th></tr></thead><tbody>{preview.results.slice(0,100).map((r:any)=><tr key={r.row}><td>{r.row}</td><td>{r.student.name}<small>{r.student.email}</small></td><td>{r.student.studentNumber}</td><td>{r.errors.length?<span className="danger">{r.errors.join(" ")}</span>:<span className="badge cleared">Ready to import</span>}</td></tr>)}</tbody></table></div>{preview.total>100&&<p className="muted small">Showing the first 100 rows. All {preview.total} rows were validated.</p>}<div className="inline-note">Existing identifiers and emails are rejected; nothing is overwritten. The whole batch commits together or no records are added. Imported accounts need secure password provisioning before students can sign in.</div><div className="import-actions"><button className="button secondary" onClick={()=>setStep(2)}>Edit mapping</button>{preview.invalid>0&&<button className="button secondary" onClick={downloadErrors}><ArrowDownToLine size={15}/>Error report</button>}<button className="button primary" disabled={busy||preview.invalid>0} onClick={()=>run("commit")}>{busy?"Importing…":"Import "+preview.valid+" students"}</button></div></>}
    {step===4&&result&&<div className="empty"><span className="empty-icon"><CheckCircle2 size={28}/></span><h3>{result.imported} student records imported.</h3><p>The source and imported row counts reconcile. Existing records were preserved. Batch reference: {result.batchId}</p><button className="button primary" onClick={()=>{setStep(1);setResult(null);setPreview(null);}}>Import another file</button></div>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    </section><section className="panel"><div className="panel-title"><div><h2>Import history</h2><p>Committed batches and their responsible operator.</p></div></div>{batches.length?<div className="table-wrap"><table><thead><tr><th>Batch</th><th>Imported rows</th><th>Operator</th><th>Date</th></tr></thead><tbody>{batches.map(b=><tr key={b.id}><td>{b.id.slice(0,8)}</td><td>{b.row_count}</td><td>{b.actor_name}</td><td>{new Date(b.created_at).toLocaleDateString("en-GB")}</td></tr>)}</tbody></table></div>:<div className="empty"><p>No batches have been imported yet.</p></div>}</section></>;
}
