import {test,expect,request,APIRequestContext} from "@playwright/test";
import {Pool} from "pg";
import {PDFDocument,StandardFonts} from "pdf-lib";
import AxeBuilder from "@axe-core/playwright";
import {randomBytes,scryptSync} from "node:crypto";
import {makeDocument} from "../lib/documents";
const baseURL="http://localhost:3100";
const db=new Pool({connectionString:process.env.TEST_DATABASE_URL});
async function as(profile:string){
  const client=await request.newContext({baseURL,extraHTTPHeaders:{Origin:baseURL}});
  const res=await client.post("/api/auth",{data:{action:"demo",profile}});expect(res.status()).toBe(200);return client;
}
async function action(client:APIRequestContext,data:object){return client.post("/api/actions",{data});}
test.afterAll(async()=>{await db.end();});

test("password authentication, session cookies, logout and rate limiting",async()=>{
  const email="login-check@students.invalid",password=randomBytes(20).toString("hex"),salt=randomBytes(16).toString("hex");
  const hash=salt+":"+scryptSync(password,salt,64).toString("hex");
  const user=(await db.query("INSERT INTO users(name,email,password_hash) VALUES('Authentication Test',$1,$2) RETURNING id",[email,hash])).rows[0];
  await db.query("INSERT INTO user_roles VALUES($1,'student')",[user.id]);
  const client=await request.newContext({baseURL,extraHTTPHeaders:{Origin:baseURL}});
  expect((await client.post("/api/auth",{data:{action:"login",email,password:"incorrect"}})).status()).toBe(401);
  const login=await client.post("/api/auth",{data:{action:"login",email,password}});expect(login.status()).toBe(200);
  expect(login.headers()["set-cookie"]).toContain("HttpOnly");expect(login.headers()["set-cookie"]).toContain("SameSite=lax");
  expect((await client.get("/portal")).status()).toBe(200);
  expect((await client.post("/api/auth",{data:{action:"logout"}})).status()).toBe(200);
  expect((await action(client,{action:"update_profile",phone:""})).status()).toBe(401);
  for(let i=0;i<8;i++)expect((await client.post("/api/auth",{data:{action:"login",email,password:"incorrect"}})).status()).toBe(401);
  expect((await client.post("/api/auth",{data:{action:"login",email,password:"incorrect"}})).status()).toBe(429);
  await client.dispose();
});

test("PDF generation preserves text or clearly rejects an unsupported language",async()=>{
  await expect(makeDocument("Clearance",["Student: عائشہ"],true)).rejects.toThrow("original record has been preserved");
  expect((await PDFDocument.load(await makeDocument("Clearance",["Student: Ayesha Noor — demonstration"],true))).getPageCount()).toBe(1);
});

test("authentication, CSRF and personal record boundaries",async({page})=>{
  await page.goto("/portal");await expect(page).toHaveURL(/login/);
  const student=await as("student");const admin=await as("admin");
  const foreign=(await db.query("SELECT e.id FROM enrollments e JOIN students s ON s.id=e.student_id JOIN users u ON u.id=s.user_id WHERE u.email='student-alt@demo.akims.test'")).rows[0];
  expect((await action(student,{action:"create_request",enrollmentId:foreign.id,purpose:"graduation"})).status()).toBe(403);
  expect((await student.post("/api/actions",{headers:{Origin:"https://untrusted.invalid"},data:{action:"update_profile",phone:"+92 300 1234567"}})).status()).toBe(403);
  expect((await action(student,{action:"save_settings",bankName:"Bad Bank",accountTitle:"Bad Account",accountNumber:"123456789",approverId:foreign.id})).status()).toBe(403);
  const html=await (await student.get("/portal")).text();
  expect(html).not.toContain("Zain Ahmed");expect(html).not.toContain("password_hash");expect(html).not.toContain("receipt_path");
  expect((await student.get("/portal/settings")).status()).toBe(404);
  expect((await student.get("/api/export?kind=payments")).status()).toBe(403);
  expect((await admin.get("/api/export?kind=requests")).status()).toBe(200);
  await student.dispose();await admin.dispose();
});

test("complete assessed clearance, bank reconciliation, protected PDFs and revocation",async()=>{
  const student=await as("student"),other=await as("student-alt"),staff=await as("staff"),accounts=await as("accounts"),admin=await as("admin");
  const r=(await db.query("SELECT * FROM clearance_requests ORDER BY number LIMIT 1")).rows[0];
  expect((await action(admin,{action:"approve_clearance",requestId:r.id})).status()).toBe(409);
  expect((await action(admin,{action:"create_challan",requestId:r.id})).status()).toBe(400);
  expect((await action(student,{action:"review_check",requestId:r.id,departmentId:"store",outcome:"cleared",note:"Forgery must fail."})).status()).toBe(403);
  expect((await action(staff,{action:"review_check",requestId:r.id,departmentId:"chemistry",outcome:"cleared",note:"Still has an unpaid issue."})).status()).toBe(409);
  expect((await action(staff,{action:"review_check",requestId:r.id,departmentId:"store",outcome:"cleared",note:"No outstanding store items."})).status()).toBe(200);
  const issued=await Promise.all([action(admin,{action:"create_challan",requestId:r.id}),action(admin,{action:"create_challan",requestId:r.id})]);
  expect(issued.map(x=>x.status())).toEqual([200,200]);
  const first=await issued[0].json(),second=await issued[1].json();expect(first.id).toBe(second.id);
  expect((await other.get("/api/documents/challan/"+first.id)).status()).toBe(404);
  const pdfResponse=await student.get("/api/documents/challan/"+first.id);expect(pdfResponse.status()).toBe(200);
  expect((await PDFDocument.load(await pdfResponse.body())).getPageCount()).toBe(1);
  const multipart={challanId:first.id,reference:"STUDENT-REF-001",amount:"1250.00",paidOn:new Date().toISOString().slice(0,10)};
  const bad=await student.post("/api/payments",{multipart:{...multipart,receipt:{name:"fake.png",mimeType:"image/png",buffer:Buffer.from("<html>not an image</html>")}}});
  expect(bad.status()).toBe(400);
  const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica);pdf.addPage().drawText("Fictional bank evidence for integration test",{font});
  const receipt={name:"receipt.pdf",mimeType:"application/pdf",buffer:Buffer.from(await pdf.save())};
  expect((await student.post("/api/payments",{multipart:{...multipart,receipt}})).status()).toBe(200);
  expect((await student.post("/api/payments",{multipart:{...multipart,receipt}})).status()).toBe(409);
  const payment=(await db.query("SELECT * FROM payments WHERE challan_id=$1",[first.id])).rows[0];
  expect((await other.get("/api/receipts/"+payment.id)).status()).toBe(404);
  expect((await staff.get("/api/receipts/"+payment.id)).status()).toBe(404);
  expect((await student.get("/api/receipts/"+payment.id)).status()).toBe(200);
  expect((await action(admin,{action:"approve_clearance",requestId:r.id})).status()).toBe(409);
  expect((await action(student,{action:"review_payment",paymentId:payment.id,outcome:"verified",note:"Unauthorized",bankReference:"BANK-001",actualAmount:"1250"})).status()).toBe(403);
  expect((await action(accounts,{action:"review_payment",paymentId:payment.id,outcome:"rejected",note:"Please supply a legible receipt.",actualAmount:""})).status()).toBe(200);
  expect((await student.post("/api/payments",{multipart:{...multipart,reference:"CORRECTED-REF",receipt}})).status()).toBe(200);
  const pending=(await db.query("SELECT id FROM payments WHERE challan_id=$1 AND status='pending'",[first.id])).rows[0];
  expect((await action(accounts,{action:"review_payment",paymentId:pending.id,outcome:"verified",note:"Incorrect amount test.",bankReference:"BANK-002",actualAmount:"1000"})).status()).toBe(400);
  const reviews=await Promise.all([1,2].map(()=>action(accounts,{action:"review_payment",paymentId:pending.id,outcome:"verified",note:"Matched to independently checked bank record.",bankReference:"BANK-002",actualAmount:"1250"})));
  expect(reviews.map(x=>x.status()).sort()).toEqual([200,409]);
  expect((await action(admin,{action:"approve_clearance",requestId:r.id})).status()).toBe(409);
  expect((await action(staff,{action:"review_check",requestId:r.id,departmentId:"chemistry",outcome:"cleared",note:"Verified payment resolves the recorded charge."})).status()).toBe(200);
  const approvals=await Promise.all([1,2].map(()=>action(admin,{action:"approve_clearance",requestId:r.id})));
  expect(approvals.map(x=>x.status())).toEqual([200,200]);
  const certs=(await db.query("SELECT * FROM certificates WHERE request_id=$1",[r.id])).rows;expect(certs).toHaveLength(1);
  const cert=certs[0];expect((await student.get("/api/documents/certificate/"+cert.id)).status()).toBe(200);
  expect(cert.document_snapshot.student_name).toBe("Ayesha Noor");
  await expect(db.query("UPDATE certificates SET document_snapshot='{}' WHERE id=$1",[cert.id])).rejects.toMatchObject({code:"23514"});
  expect((await other.get("/api/documents/certificate/"+cert.id)).status()).toBe(404);
  const verification=await (await request.newContext({baseURL})).get("/verify/"+cert.token);
  const html=await verification.text();expect(html).toContain("Clearance verified");expect(html).not.toContain("Ayesha");expect(html).not.toContain("1250");
  expect((await action(admin,{action:"revoke_certificate",certificateId:cert.id,note:"Demonstration correction requested."})).status()).toBe(200);
  expect((await student.get("/api/documents/certificate/"+cert.id)).status()).toBe(409);
  expect(await (await other.get("/verify/"+cert.token)).text()).toContain("Certificate revoked");
  await Promise.all([student,other,staff,accounts,admin].map(c=>c.dispose()));
});

test("zero-dues clearance, duplicate submissions and database approval guards",async()=>{
  const student=await as("student-alt"),staff=await as("staff"),admin=await as("admin");
  const e=(await db.query("SELECT e.id FROM enrollments e JOIN students s ON s.id=e.student_id JOIN users u ON u.id=s.user_id WHERE u.email='student-alt@demo.akims.test'")).rows[0];
  const submitted=await Promise.all([1,2].map(()=>action(student,{action:"create_request",enrollmentId:e.id,purpose:"graduation"})));
  expect(submitted.map(r=>r.status()).sort()).toEqual([200,409]);
  const req=(await db.query("SELECT * FROM clearance_requests WHERE enrollment_id=$1",[e.id])).rows[0];
  const adminId=(await db.query("SELECT id FROM users WHERE email='admin@demo.akims.test'")).rows[0].id;
  await expect(db.query("UPDATE clearance_requests SET status='approved',approved_by=$2 WHERE id=$1",[req.id,adminId])).rejects.toMatchObject({code:"23514"});
  for(const departmentId of ["anatomy","physiology","chemistry","store"])expect((await action(staff,{action:"review_check",requestId:req.id,departmentId,outcome:"cleared",note:"Verified no outstanding requirements."})).status()).toBe(200);
  expect((await action(admin,{action:"create_challan",requestId:req.id})).status()).toBe(400);
  expect((await action(admin,{action:"approve_clearance",requestId:req.id})).status()).toBe(200);
  expect((await db.query("SELECT 1 FROM challans WHERE request_id=$1",[req.id])).rowCount).toBe(0);
  await expect(db.query("UPDATE clearance_checks SET status='pending' WHERE request_id=$1",[req.id])).rejects.toMatchObject({code:"23514"});
  await expect(db.query("DELETE FROM audit_events WHERE request_id=$1",[req.id])).rejects.toMatchObject({code:"23514"});
  await Promise.all([student,staff,admin].map(c=>c.dispose()));
});

test("department scoping and transactional inventory prevent unauthorized or negative stock",async()=>{
  const staff=await as("staff"),admin=await as("admin");
  const sid=(await db.query("SELECT id FROM users WHERE email='staff@demo.akims.test'")).rows[0].id;
  const item=(await db.query("SELECT * FROM inventory WHERE department_id='store' LIMIT 1")).rows[0];
  await db.query("DELETE FROM staff_assignments WHERE user_id=$1 AND department_id='store'",[sid]);
  try{
    expect((await action(staff,{action:"stock_change",inventoryId:item.id,delta:1,note:"Unauthorized department test."})).status()).toBe(403);
    expect(await (await staff.get("/portal/inventory")).text()).not.toContain(item.sku);
  }finally{await db.query("INSERT INTO staff_assignments VALUES($1,'store')",[sid]);}
  expect((await action(staff,{action:"stock_change",inventoryId:item.id,delta:-10000,note:"Negative balance test."})).status()).toBe(400);
  expect((await db.query("SELECT quantity FROM inventory WHERE id=$1",[item.id])).rows[0].quantity).toBe(item.quantity);
  expect((await action(staff,{action:"stock_change",inventoryId:item.id,delta:3,note:"Verified receipt of three units."})).status()).toBe(200);
  const after=(await db.query("SELECT quantity FROM inventory WHERE id=$1",[item.id])).rows[0].quantity;expect(after).toBe(item.quantity+3);
  expect((await action(admin,{action:"add_inventory",name:"=HYPERLINK(\"https://invalid.test\")",sku:"SEC-CSV-1",departmentId:"store",category:"apparatus",quantity:1,location:"Testing shelf"})).status()).toBe(200);
  const exported=await (await admin.get("/api/export?kind=inventory")).text();expect(exported).toContain("\"'=HYPERLINK");
  await staff.dispose();await admin.dispose();
});

test("imports validate mappings, reject duplicates atomically, and retain source provenance",async()=>{
  const admin=await as("admin");
  const mapping={studentNumber:0,name:1,email:2,program:3,batch:4,semester:5};
  const good=["AK-TEST-9001","Synthetic Import Student","imported@students.invalid","dpt","2025–2029","2"];
  const bad=["AK-2022-0148","Duplicate","student@demo.akims.test","wrong","2025–2029","2"];
  const count=Number((await db.query("SELECT count(*) FROM students")).rows[0].count);
  const preview=await admin.post("/api/imports",{data:{mode:"preview",mapping,rows:[good,bad]}});expect(preview.status()).toBe(200);
  expect((await preview.json()).invalid).toBe(1);
  expect((await admin.post("/api/imports",{data:{mode:"commit",mapping,rows:[good,bad]}})).status()).toBe(400);
  expect(Number((await db.query("SELECT count(*) FROM students")).rows[0].count)).toBe(count);
  const imported=await admin.post("/api/imports",{data:{mode:"commit",mapping,rows:[good]}});expect(imported.status()).toBe(200);
  const body=await imported.json();expect(body.imported).toBe(1);
  const student=(await db.query("SELECT * FROM students WHERE student_number=$1",[good[0]])).rows[0];expect(student.import_batch_id).toBe(body.batchId);expect(student.import_row_number).toBe(2);
  expect((await admin.post("/api/imports",{data:{mode:"commit",mapping,rows:[good]}})).status()).toBe(400);
  await admin.dispose();
});

test("deactivation revokes live sessions and preserves historical records",async()=>{
  const student=await as("student-alt"),admin=await as("admin");
  const id=(await db.query("SELECT id FROM users WHERE email='student-alt@demo.akims.test'")).rows[0].id;
  expect((await action(admin,{action:"set_user_active",userId:id,active:false})).status()).toBe(200);
  expect((await action(student,{action:"update_profile",phone:"+92 300 0000000"})).status()).toBe(401);
  expect((await db.query("SELECT 1 FROM students WHERE user_id=$1",[id])).rowCount).toBe(1);
  expect((await action(admin,{action:"set_user_active",userId:id,active:true})).status()).toBe(200);
  await student.dispose();await admin.dispose();
});

for(const [profile,heading] of [["student","Welcome back, Ayesha."],["staff","Your workbench, Saira."],["accounts","Every payment, accounted for."],["admin","A connected campus. A clearer picture."],["teacher","Good to see you, Dr. Maryam Ali."],["alumni","Always part of AKIMS, Omar."]]){
  test(profile+" has a distinct accessible desktop and mobile workspace",async({page})=>{
    const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto("/login");const login=await page.request.post("/api/auth",{headers:{Origin:baseURL},data:{action:"demo",profile}});expect(login.status()).toBe(200);
    await page.goto("/portal");await expect(page.getByRole("heading",{name:heading,exact:true})).toBeVisible();
    const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
    expect(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
    await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.getByRole("button",{name:"Open navigation",exact:true}).click();
    await expect(page.getByRole("navigation",{name:"Workspace navigation"})).toBeVisible();
    await page.getByRole("button",{name:"Close navigation",exact:true}).click();
    expect(errors).toEqual([]);
  });
}

test("teacher observation form persists a collective observation",async({page})=>{
  await page.goto("/login");await page.request.post("/api/auth",{headers:{Origin:baseURL},data:{action:"demo",profile:"teacher"}});
  await page.goto("/portal/classes");
  await page.getByRole("button",{name:"Add class observation"}).first().click();
  await page.getByLabel("Class observation",{exact:true}).fill("The class would benefit from more practical demonstrations.");
  await page.getByRole("button",{name:"Confirm & save"}).click();
  await expect(page.getByRole("status")).toContainText("Class observation saved");
  await page.goto("/portal/observations");
  await expect(page.getByText("The class would benefit from more practical demonstrations.",{exact:true})).toBeVisible();
});
