import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID,createHash } from "node:crypto";
import { mkdir,writeFile,unlink } from "node:fs/promises";
import path from "node:path";
import { checkOrigin,requireUser,requireRole } from "@/lib/auth";
import { assert,audit,transaction } from "@/lib/db";
import { failure } from "@/lib/http";
import { toPaisa } from "@/lib/workflow";
export async function POST(req:Request){
  let saved:string|undefined;
  try{
    checkOrigin(req);const user=await requireUser();requireRole(user,"student");
    const length=Number(req.headers.get("content-length")||0);
    assert(length<=6*1024*1024,"Receipt must be smaller than 5 MB.");
    const form=await req.formData();
    const challanId=z.string().uuid().parse(form.get("challanId"));
    const reference=z.string().trim().min(4).max(100).parse(form.get("reference"));
    const paidOn=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(form.get("paidOn"));
    const date=new Date(paidOn+"T00:00:00Z");
    assert(!Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===paidOn,"Enter a valid payment date.");
    assert(date.valueOf()<=Date.now()+86400000 && date.valueOf()>Date.now()-366*86400000,"Payment date is outside the accepted review period.");
    const money=toPaisa(String(form.get("amount")||""));
    const file=form.get("receipt");assert(file instanceof File && file.size>0 && file.size<=5*1024*1024,"Choose a PDF, PNG or JPEG receipt up to 5 MB.");
    const bytes=Buffer.from(await file.arrayBuffer());
    const type=bytes.subarray(0,5).toString()==="%PDF-"?"application/pdf":bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?"image/png":bytes[0]===255&&bytes[1]===216&&bytes[2]===255?"image/jpeg":null;
    assert(type,"This file is not a supported PDF, PNG or JPEG receipt.");
    const dir=path.resolve(process.env.STORAGE_DIR||".local/uploads");
    await mkdir(dir,{recursive:true,mode:0o700});
    const filename=randomUUID();saved=path.join(dir,filename);
    await writeFile(saved,bytes,{mode:0o600,flag:"wx"});
    await transaction(async db=>{
      const c=(await db.query("SELECT c.*,s.user_id FROM challans c JOIN clearance_requests r ON r.id=c.request_id JOIN students s ON s.id=r.student_id WHERE c.id=$1",[challanId])).rows[0];
      assert(c&&c.user_id===user.id,"Challan not found.",404);
      const r=(await db.query("SELECT status FROM clearance_requests WHERE id=$1 FOR UPDATE",[c.request_id])).rows[0];
      const current=(await db.query("SELECT status FROM challans WHERE id=$1",[c.id])).rows[0];
      assert(r.status==="under_review"&&current.status==="issued","This challan is no longer accepting payments.",409);
      assert(c.amount_paisa===money,"Enter the full challan amount. Contact Accounts about partial or excess payments.");
      await db.query("INSERT INTO payments(challan_id,amount_paisa,transaction_reference,paid_on,receipt_path,receipt_type,receipt_hash,submitted_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[c.id,money,reference,paidOn,filename,type,createHash("sha256").update(bytes).digest("hex"),user.id]);
      await audit(db,user.id,"payment.submitted","Receipt submitted; awaiting independent Accounts verification.",c.request_id);
    });
    saved=undefined;return NextResponse.json({message:"Receipt submitted. Accounts will verify the bank payment."});
  }catch(e){if(saved)await unlink(saved).catch(()=>{});return failure(e);}
}
