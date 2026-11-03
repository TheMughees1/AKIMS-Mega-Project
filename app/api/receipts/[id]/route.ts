import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";
import { pool,assert } from "@/lib/db";
import { failure } from "@/lib/http";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const user=await requireUser();const {id}=await params;
    const p=(await pool.query("SELECT p.*,s.user_id FROM payments p JOIN challans c ON c.id=p.challan_id JOIN clearance_requests r ON r.id=c.request_id JOIN students s ON s.id=r.student_id WHERE p.id=$1",[id])).rows[0];
    assert(p&&(p.user_id===user.id||["admin","accounts"].includes(user.role)),"Receipt not found.",404);
    const bytes=await readFile(path.join(path.resolve(process.env.STORAGE_DIR||".local/uploads"),p.receipt_path));
    return new Response(bytes,{headers:{"Content-Type":p.receipt_type,"Content-Disposition":"attachment; filename=\"payment-receipt."+({"application/pdf":"pdf","image/png":"png","image/jpeg":"jpg"} as Record<string,string>)[p.receipt_type]+"\"","Cache-Control":"private, no-store","Content-Security-Policy":"sandbox"}});
  }catch(e){return failure(e);}
}
