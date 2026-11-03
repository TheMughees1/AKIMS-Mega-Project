import { requireRole,requireUser } from "@/lib/auth";
import { portalData } from "@/lib/data";
import { csvCell } from "@/lib/csv";
import { assert } from "@/lib/db";
import { failure } from "@/lib/http";
export async function GET(req:Request){
  try{
    const user=await requireUser();requireRole(user,"admin","accounts","staff");
    const kind=new URL(req.url).searchParams.get("kind");
    assert(kind&&["requests","inventory","payments"].includes(kind),"Choose an available report.");
    if(kind==="inventory")requireRole(user,"admin","staff");
    if(kind==="payments")requireRole(user,"admin","accounts");
    const d=await portalData(user);
    const fields:Record<string,string[]>={requests:["number","student_name","student_number","program","purpose","status","created_at"],inventory:["sku","name","category","department_name","location","quantity","reorder_level"],payments:["student_name","student_number","challan_number","amount_paisa","transaction_reference","status","created_at"]};
    const cols=fields[kind];const rows=d[kind==="requests"?"requests":kind];
    const csv=[cols.map(csvCell).join(","),...rows.map((r:Record<string,unknown>)=>cols.map(c=>csvCell(r[c])).join(","))].join("\r\n");
    return new Response("\uFEFF"+csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=\"AKIMS-"+kind+".csv\"","Cache-Control":"private, no-store"}});
  }catch(e){return failure(e);}
}
