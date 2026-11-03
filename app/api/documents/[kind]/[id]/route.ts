import { requireUser } from "@/lib/auth";
import { assert,demoEnabled,pool } from "@/lib/db";
import { makeDocument } from "@/lib/documents";
import { failure } from "@/lib/http";
import { z } from "zod";
export async function GET(_req:Request,{params}:{params:Promise<{kind:string,id:string}>}){
  try{
    const user=await requireUser();const {kind,id}=await params;z.string().uuid().parse(id);
    assert(["challan","certificate"].includes(kind),"Document not found.",404);
    const record=(await pool.query("SELECT d.*,u.name AS student_name,s.student_number,s.user_id,p.name AS program FROM "+(kind==="challan"?"challans":"certificates")+" d JOIN clearance_requests r ON r.id=d.request_id JOIN students s ON s.id=r.student_id JOIN users u ON u.id=s.user_id JOIN enrollments e ON e.id=r.enrollment_id JOIN programs p ON p.id=e.program_id WHERE d.id=$1",[id])).rows[0];
    assert(record&&(record.user_id===user.id||["admin","accounts"].includes(user.role)),"Document not found.",404);
    const identity=kind==="certificate"?record.document_snapshot:record;
    let lines=[ "Reference: "+(kind==="challan"?"CH-":"CL-")+String(record.number).padStart(5,"0"),"Student: "+identity.student_name+" ("+identity.student_number+")","Program: "+identity.program ];
    let verifyUrl:string|undefined;
    if(kind==="challan"){
      const details=(await pool.query("SELECT title,amount_paisa FROM challan_lines WHERE challan_id=$1",[id])).rows;
      lines.push("Status: "+record.status.toUpperCase(),...details.map(d=>d.title+" - PKR "+(d.amount_paisa/100).toFixed(2)),"Total: PKR "+(record.amount_paisa/100).toFixed(2),"Bank: "+record.bank_snapshot.name,"Account title: "+record.bank_snapshot.title,"Account number / IBAN: "+record.bank_snapshot.account,"Use the challan reference when paying. Upload your receipt in the student portal.","Payment is subject to Accounts verification. This challan is not final clearance.");
    }else{
      assert(record.status==="active","This certificate has been revoked. Contact the institution.",409);
      lines.push("Issued: "+new Date(record.issued_at).toISOString().slice(0,10),"All mandatory departmental requirements on this application were completed.","Final clearance was authorized by the institution's configured approver.","Verify the current status using the QR code. This record does not certify graduation.");
      verifyUrl=process.env.APP_ORIGIN+"/verify/"+record.token;
    }
    const bytes=await makeDocument(kind==="challan"?"Clearance payment challan":"Final clearance certificate",lines,demoEnabled(),verifyUrl);
    return new Response(Buffer.from(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=\"AKIMS-"+kind+"-"+record.number+".pdf\"","Cache-Control":"private, no-store"}});
  }catch(e){return failure(e);}
}
