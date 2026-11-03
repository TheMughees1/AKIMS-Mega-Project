import { z } from "zod";
import { createHash,randomBytes,scryptSync } from "node:crypto";
import { checkOrigin,requireRole,requireUser } from "@/lib/auth";
import { assert,audit,transaction } from "@/lib/db";
import { failure } from "@/lib/http";
const column=z.coerce.number().int().min(0).max(39);
const schema=z.object({
  mode:z.enum(["preview","commit"]),
  rows:z.array(z.array(z.string().max(1000)).min(1).max(40)).min(1).max(1000),
  mapping:z.object({studentNumber:column,name:column,email:column,program:column,batch:column,semester:column})
});
const studentSchema=z.object({studentNumber:z.string().trim().min(2).max(40),name:z.string().trim().min(2).max(120),email:z.string().trim().toLowerCase().email().max(200),program:z.string().trim().min(1).max(40),batch:z.string().trim().min(3).max(40),semester:z.coerce.number().int().min(1).max(20)});
export async function POST(req:Request){
  try{
    checkOrigin(req);const user=await requireUser();requireRole(user,"admin");
    assert(Number(req.headers.get("content-length")||0)<2*1024*1024,"Import file is too large.");
    const a=schema.parse(await req.json());
    assert(new Set(Object.values(a.mapping)).size===6,"Map each required field to a different source column.");
    return Response.json(await transaction(async db=>{
      if(a.mode==="commit")await db.query("SELECT pg_advisory_xact_lock(721034)");
      const programs=new Set((await db.query("SELECT id FROM programs")).rows.map(p=>p.id));
      const existing=(await db.query("SELECT lower(s.student_number) AS number,lower(u.email) AS email FROM students s JOIN users u ON u.id=s.user_id")).rows;
      const existingEmails=new Set((await db.query("SELECT lower(email) AS email FROM users")).rows.map(u=>u.email));
      const numbers=new Set(existing.map(e=>e.number));const emails=new Set(existingEmails);
      const results=a.rows.map((row,index)=>{
        const mapped=Object.fromEntries(Object.entries(a.mapping).map(([key,position])=>[key,row[position]??""]));
        const parsed=studentSchema.safeParse(mapped);
        const errors:string[]=[];
        if(!parsed.success)errors.push(...parsed.error.issues.map(i=>i.path.join(".")+": "+i.message));
        const s=parsed.success?parsed.data:null;
        if(s){
          if(!programs.has(s.program))errors.push("Unknown program code. Use a configured program.");
          if(numbers.has(s.studentNumber.toLowerCase()))errors.push("Student identifier already exists in this file or the system.");
          if(emails.has(s.email))errors.push("Email already exists in this file or the system.");
          numbers.add(s.studentNumber.toLowerCase());emails.add(s.email);
        }
        return {row:index+2,student:s||mapped,errors};
      });
      const invalid=results.filter(r=>r.errors.length).length;
      if(a.mode==="preview")return {results,valid:results.length-invalid,invalid,total:results.length};
      assert(!invalid,"This batch contains invalid or duplicate records. Review the preview before importing.");
      const sourceHash=createHash("sha256").update(JSON.stringify({rows:a.rows,mapping:a.mapping})).digest("hex");
      assert(!(await db.query("SELECT 1 FROM import_batches WHERE source_hash=$1",[sourceHash])).rowCount,"This exact batch has already been imported.",409);
      const batch=(await db.query("INSERT INTO import_batches(actor_id,source_hash,row_count,source_mapping) VALUES($1,$2,$3,$4) RETURNING id",[user.id,sourceHash,results.length,JSON.stringify(a.mapping)])).rows[0];
      for(const result of results){
        const s=studentSchema.parse(result.student);
        const salt=randomBytes(16).toString("hex");
        const hash=salt+":"+scryptSync(randomBytes(32),salt,64).toString("hex");
        const u=(await db.query("INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id",[s.name,s.email,hash])).rows[0];
        await db.query("INSERT INTO user_roles VALUES($1,'student')",[u.id]);
        const st=(await db.query("INSERT INTO students(user_id,student_number,import_batch_id,import_row_number) VALUES($1,$2,$3,$4) RETURNING id",[u.id,s.studentNumber,batch.id,result.row])).rows[0];
        await db.query("INSERT INTO enrollments(student_id,program_id,batch,semester,status) VALUES($1,$2,$3,$4,'active')",[st.id,s.program,s.batch,s.semester]);
      }
      await audit(db,user.id,"students.imported",results.length+" students imported in batch "+batch.id+". No records overwritten.");
      return {imported:results.length,batchId:batch.id};
    }));
  }catch(e){return failure(e);}
}
