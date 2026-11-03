import pg from "pg";
import {randomBytes,scryptSync} from "node:crypto";
if(process.env.APP_ENV==="production"||process.env.DEMO_MODE!=="true")throw new Error("Demo seed requires a non-production DEMO_MODE environment.");
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
await db.connect();
await db.query("BEGIN");
try{
  if((await db.query("SELECT 1 FROM users LIMIT 1")).rowCount){console.log("Existing records preserved; seed skipped.");await db.query("ROLLBACK");}
  else{
    const ids={};
    for(const [key,name,role] of [
      ["student","Ayesha Noor","student"],["student-alt","Zain Ahmed","student"],
      ["staff","Saira Khan","staff"],["accounts","Bilal Hassan","accounts"],
      ["admin","Amina Rehman","admin"],["teacher","Dr. Maryam Ali","teacher"],["alumni","Omar Shah","alumni"]
    ]){
      const salt=randomBytes(16).toString("hex");
      const hash=salt+":"+scryptSync(randomBytes(32),salt,64).toString("hex");
      ids[key]=(await db.query("INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id",[name,key+"@demo.akims.test",hash])).rows[0].id;
      await db.query("INSERT INTO user_roles VALUES($1,$2)",[ids[key],role]);
    }
    await db.query("INSERT INTO programs VALUES ('dpt','Doctor of Physical Therapy','DPT'),('mlt','BS Medical Laboratory Technology','BS MLT'),('nursing','BS Nursing','BSN')");
    for(const [id,name,kind] of [["anatomy","Anatomy Lab","lab"],["physiology","Physiology Lab","lab"],["chemistry","Biochemistry Lab","lab"],["store","Central Store","store"]]){
      await db.query("INSERT INTO departments VALUES($1,$2,$3)",[id,name,kind]);
      await db.query("INSERT INTO staff_assignments VALUES($1,$2)",[ids.staff,id]);
      for(const p of ["dpt","mlt","nursing"])await db.query("INSERT INTO program_requirements VALUES($1,$2)",[p,id]);
    }
    const students={};
    const enrollments={};
    for(const [key,number,alumni] of [["student","AK-2022-0148",false],["student-alt","AK-2022-0196",false],["alumni","AK-2019-0032",true]]){
      students[key]=(await db.query("INSERT INTO students(user_id,student_number,alumni) VALUES($1,$2,$3) RETURNING id",[ids[key],number,alumni])).rows[0].id;
      enrollments[key]=(await db.query("INSERT INTO enrollments(student_id,program_id,batch,semester,status) VALUES($1,'dpt',$2,8,$3) RETURNING id",[students[key],alumni?"2019–2023":"2022–2026",alumni?"completed":"active"])).rows[0].id;
    }
    const request=(await db.query("INSERT INTO clearance_requests(student_id,enrollment_id,purpose,created_by,created_at) VALUES($1,$2,'graduation',$3,now()-interval '3 days') RETURNING id",[students.student,enrollments.student,ids.student])).rows[0].id;
    for(const [dept,status,note] of [["anatomy","cleared","All issued equipment returned."],["physiology","cleared","No outstanding obligations."],["chemistry","action_required","One confirmed apparatus charge awaits resolution."],["store","pending","Awaiting store verification."]]){
      await db.query("INSERT INTO clearance_checks(request_id,department_id,status,note,reviewed_by) VALUES($1,$2,$3,$4,$5)",[request,dept,status,note,status==="pending"?null:ids.staff]);
    }
    await db.query("INSERT INTO incidents(request_id,department_id,title,description,amount_paisa,status,created_by) VALUES($1,'chemistry','Damaged measuring cylinder','Demonstration case: a 100 ml measuring cylinder was recorded as damaged during practical work. Illustrative valuation only.',125000,'confirmed',$2)",[request,ids.staff]);
    for(const [dept,name,sku,cat,qty,reorder,loc] of [
      ["anatomy","Anatomical model set","ANT-001","apparatus",24,5,"Cabinet A · Shelf 2"],
      ["anatomy","Microscope slide kits","ANT-002","apparatus",48,10,"Cabinet B · Shelf 1"],
      ["physiology","Digital blood pressure monitor","PHY-001","apparatus",18,5,"Room 02 · Cabinet C"],
      ["chemistry","Measuring cylinder · 100 ml","BIO-001","apparatus",4,10,"Cabinet A · Shelf 3"],
      ["chemistry","Laboratory gloves","BIO-002","consumable",180,50,"Store room · Bay 1"],
      ["store","Desktop workstation","IT-001","computer",32,3,"Computer Lab"],
      ["store","Lab coats","STR-001","consumable",8,15,"Central Store · Bay 2"],
      ["physiology","Stethoscope","PHY-002","apparatus",36,10,"Room 02 · Cabinet A"]
    ]){
      const item=(await db.query("INSERT INTO inventory(department_id,name,sku,category,quantity,reorder_level,location) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",[dept,name,sku,cat,qty,reorder,loc])).rows[0].id;
      await db.query("INSERT INTO stock_movements(inventory_id,delta,reason,actor_id) VALUES($1,$2,'Opening demonstration balance',$3)",[item,qty,ids.admin]);
    }
    await db.query("INSERT INTO settings VALUES ('bank',$1),('final_approver',$2),('policy',$3)",[
      JSON.stringify({name:"Demonstration bank — not payable",title:"AKIMS demonstration workspace",account:"NOT A BANK ACCOUNT",demo:true}),
      JSON.stringify(ids.admin),
      JSON.stringify({version:1,purposes:["graduation","transfer","withdrawal"],description:"Demonstration policy. Confirm institutional eligibility and valuation before production."})
    ]);
    for(const [title,body,category,audience] of [
      ["Your next chapter starts here","Submit your clearance application and track every departmental check in one place.","Campus",["student","alumni"]],
      ["A smoother clearance experience","Keep your bank receipt and transaction reference ready. Accounts will verify each submission.","Clearance",["student","staff","accounts","admin"]],
      ["Share what works in your classroom","Record collective observations for your assigned classes. Avoid individual student evaluations.","Academic",["teacher","admin"]]
    ])await db.query("INSERT INTO announcements(title,body,category,audience) VALUES($1,$2,$3,$4)",[title,body,category,audience]);
    await db.query("INSERT INTO classes(teacher_id,name,program_id,semester,section,student_count,schedule) VALUES($1,'Human Anatomy','dpt',2,'A',42,'Monday & Wednesday · 09:00'),($1,'Clinical Physiology','dpt',4,'B',36,'Tuesday & Thursday · 11:00')",[ids.teacher]);
    await db.query("INSERT INTO audit_events(actor_id,action,request_id,detail) VALUES($1,'request.submitted',$2,'Graduation clearance submitted.'),($3,'department.cleared',$2,'Anatomy Lab verified its checklist.'),($3,'incident.confirmed',$2,'Biochemistry Lab recorded an apparatus obligation.')",[ids.student,request,ids.staff]);
    await db.query("COMMIT");console.log("Fictional demonstration records created. No usable passwords were seeded.");
  }
}catch(e){await db.query("ROLLBACK");throw e;}finally{await db.end();}
