import { PoolClient } from "pg";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { AppError, assert, audit, demoEnabled, transaction } from "./db";
import { User, requireRole } from "./auth";
const id=z.string().uuid();
const text=z.string().trim().min(3).max(2000);
const amount=z.string().regex(/^\d{1,7}(\.\d{1,2})?$/,"Enter a valid amount with up to two decimal places.");
export function toPaisa(s:string) {
  amount.parse(s); const [whole,fraction=""]=s.split(".");
  const n=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  assert(Number.isSafeInteger(n) && n<=100000000,"Amount is too large.");return n;
}
async function lockedRequest(db:PoolClient,requestId:string) {
  const r=(await db.query("SELECT * FROM clearance_requests WHERE id=$1 FOR UPDATE",[requestId])).rows[0];
  assert(r,"Clearance request not found.",404); return r;
}
async function areaAccess(db:PoolClient,user:User,department:string) {
  requireRole(user,"admin","staff");
  if(user.role!=="admin") assert((await db.query("SELECT 1 FROM staff_assignments WHERE user_id=$1 AND department_id=$2",[user.id,department])).rowCount,"This department is outside your assignment.",403);
}
async function editable(db:PoolClient,requestId:string) {
  const r=await lockedRequest(db,requestId);
  assert(r.status==="under_review","This clearance is already closed.",409); return r;
}
async function unbilled(db:PoolClient,requestId:string) {
  assert(!(await db.query("SELECT 1 FROM challans WHERE request_id=$1 AND status<>'cancelled'",[requestId])).rowCount,"Cancel the existing challan before changing its assessment. Verified payments require institutional review.",409);
}
export async function executeAction(user:User,input:unknown) {
  const raw=z.object({action:z.string()}).passthrough().parse(input);
  return transaction(async db=>{
    switch(raw.action){
      case "create_request": {
        const a=z.object({enrollmentId:id,purpose:z.enum(["graduation","transfer","withdrawal"])}).parse(raw);
        requireRole(user,"student","staff","admin");
        const enrollment=(await db.query("SELECT e.*,s.user_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE e.id=$1 FOR UPDATE OF e",[a.enrollmentId])).rows[0];
        assert(enrollment,"Enrollment not found.",404);
        if(user.role==="student")assert(enrollment.user_id===user.id,"This is not your enrollment.",403);
        if(user.role==="staff")assert((await db.query("SELECT 1 FROM program_requirements p JOIN staff_assignments a ON a.department_id=p.department_id WHERE p.program_id=$1 AND a.user_id=$2",[enrollment.program_id,user.id])).rowCount,"This student is outside your assignment.",403);
        const policy=(await db.query("SELECT value FROM settings WHERE key='policy'")).rows[0]?.value;
        assert(policy?.purposes?.includes(a.purpose),"This clearance purpose is not enabled.");
        const departments=(await db.query("SELECT department_id FROM program_requirements WHERE program_id=$1",[enrollment.program_id])).rows;
        assert(departments.length,"No clearance policy has been configured for this program.");
        const r=(await db.query("INSERT INTO clearance_requests(student_id,enrollment_id,purpose,policy_version,created_by) VALUES($1,$2,$3,$4,$5) RETURNING id",[enrollment.student_id,a.enrollmentId,a.purpose,policy.version,user.id])).rows[0];
        for(const d of departments)await db.query("INSERT INTO clearance_checks(request_id,department_id) VALUES($1,$2)",[r.id,d.department_id]);
        await audit(db,user.id,"request.submitted","Clearance application submitted.",r.id);
        return {message:"Your clearance application has been submitted.",id:r.id};
      }
      case "review_check": {
        const a=z.object({requestId:id,departmentId:z.string(),outcome:z.enum(["cleared","action_required"]),note:text}).parse(raw);
        await areaAccess(db,user,a.departmentId); await editable(db,a.requestId);
        assert((await db.query("SELECT 1 FROM clearance_checks WHERE request_id=$1 AND department_id=$2",[a.requestId,a.departmentId])).rowCount,"Requirement not found.",404);
        if(a.outcome==="cleared")assert(!(await db.query("SELECT 1 FROM incidents WHERE request_id=$1 AND department_id=$2 AND status IN ('investigating','confirmed')",[a.requestId,a.departmentId])).rowCount,"Resolve this department's outstanding issues before clearing it.",409);
        await db.query("UPDATE clearance_checks SET status=$3,note=$4,reviewed_by=$5,reviewed_at=now() WHERE request_id=$1 AND department_id=$2",[a.requestId,a.departmentId,a.outcome,a.note,user.id]);
        await audit(db,user.id,"department."+a.outcome,a.note,a.requestId);
        return {message:"Department assessment saved."};
      }
      case "add_incident": {
        const a=z.object({requestId:id,departmentId:z.string(),title:z.string().trim().min(3).max(120),description:text,amount,status:z.enum(["investigating","confirmed"])}).parse(raw);
        await areaAccess(db,user,a.departmentId);await editable(db,a.requestId);await unbilled(db,a.requestId);
        const money=toPaisa(a.amount);
        assert(a.status!=="confirmed"||money>0,"Confirmed charges must have a positive amount. Use investigation for an unvalued issue.");
        assert((await db.query("SELECT 1 FROM clearance_checks WHERE request_id=$1 AND department_id=$2",[a.requestId,a.departmentId])).rowCount,"Requirement not found.",404);
        await db.query("INSERT INTO incidents(request_id,department_id,title,description,amount_paisa,status,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)",[a.requestId,a.departmentId,a.title,a.description,money,a.status,user.id]);
        await db.query("UPDATE clearance_checks SET status='action_required',note=$3,reviewed_by=$4,reviewed_at=now() WHERE request_id=$1 AND department_id=$2",[a.requestId,a.departmentId,a.title,user.id]);
        await audit(db,user.id,"incident."+a.status,a.title,a.requestId);return {message:"Issue recorded with its assessment."};
      }
      case "resolve_incident": {
        const a=z.object({incidentId:id,resolution:z.enum(["returned","replaced","waived","confirmed"]),note:text,amount:amount.optional()}).parse(raw);
        const incident=(await db.query("SELECT * FROM incidents WHERE id=$1",[a.incidentId])).rows[0];
        assert(incident,"Issue not found.",404);await areaAccess(db,user,incident.department_id);
        await editable(db,incident.request_id);await unbilled(db,incident.request_id);
        if(a.resolution==="waived")requireRole(user,"admin");
        assert(["investigating","confirmed"].includes(incident.status),"This issue is already resolved.");
        const money=a.resolution==="confirmed"?toPaisa(a.amount??"0"):incident.amount_paisa;
        assert(a.resolution!=="confirmed"||money>0,"Enter an approved positive charge.");
        const status=a.resolution==="confirmed"?"confirmed":a.resolution==="waived"?"waived":"resolved";
        await db.query("UPDATE incidents SET status=$2,resolution=$3,amount_paisa=$4 WHERE id=$1",[incident.id,status,a.resolution+": "+a.note,money]);
        await audit(db,user.id,"incident."+status,a.note,incident.request_id);return {message:"Issue resolution saved."};
      }
      case "create_challan": {
        requireRole(user,"admin","accounts");
        const a=z.object({requestId:id}).parse(raw);await editable(db,a.requestId);
        const existing=(await db.query("SELECT id FROM challans WHERE request_id=$1 AND status<>'cancelled'",[a.requestId])).rows[0];
        if(existing)return {message:"The existing challan is ready to download.",id:existing.id};
        assert(!(await db.query("SELECT 1 FROM clearance_checks WHERE request_id=$1 AND status='pending'",[a.requestId])).rowCount,"All departments must assess the request before a challan is issued.");
        assert(!(await db.query("SELECT 1 FROM incidents WHERE request_id=$1 AND status='investigating'",[a.requestId])).rowCount,"Complete outstanding investigations before issuing a challan.");
        const lines=(await db.query("SELECT * FROM incidents WHERE request_id=$1 AND status='confirmed'",[a.requestId])).rows;
        const total=lines.reduce((s:number,x)=>s+x.amount_paisa,0);assert(total>0,"There are no confirmed charges to pay.");
        const bank=(await db.query("SELECT value FROM settings WHERE key='bank'")).rows[0]?.value;
        assert(bank?.name&&bank?.title&&bank?.account,"Configure the institution's verified bank details first.");
        assert(!bank.demo||demoEnabled(),"Demonstration bank details cannot be used in production.");
        const c=(await db.query("INSERT INTO challans(request_id,amount_paisa,bank_snapshot,created_by) VALUES($1,$2,$3,$4) RETURNING id",[a.requestId,total,bank,user.id])).rows[0];
        for(const line of lines)await db.query("INSERT INTO challan_lines VALUES($1,$2,$3,$4)",[c.id,line.id,line.title,line.amount_paisa]);
        await audit(db,user.id,"challan.issued","Challan issued for confirmed laboratory/store obligations.",a.requestId);
        return {message:"Challan issued. The student can now download it.",id:c.id};
      }
      case "cancel_challan": {
        requireRole(user,"admin","accounts");
        const a=z.object({challanId:id,note:text}).parse(raw);
        const c=(await db.query("SELECT * FROM challans WHERE id=$1",[a.challanId])).rows[0];assert(c,"Challan not found.",404);
        await editable(db,c.request_id);
        assert(c.status==="issued","Only an unpaid issued challan can be cancelled.");
        assert(!(await db.query("SELECT 1 FROM payments WHERE challan_id=$1 AND status IN ('pending','verified')",[c.id])).rowCount,"Resolve submitted payments before cancelling this challan.");
        await db.query("UPDATE challans SET status='cancelled' WHERE id=$1",[c.id]);
        await audit(db,user.id,"challan.cancelled",a.note,c.request_id);return {message:"Challan cancelled. Its original record is retained."};
      }
      case "review_payment": {
        requireRole(user,"accounts");
        const a=z.object({paymentId:id,outcome:z.enum(["verified","rejected"]),note:text,bankReference:z.string().trim().max(100).optional(),actualAmount:z.preprocess(v=>v===""?undefined:v,amount.optional())}).parse(raw);
        const p=(await db.query("SELECT p.*,c.request_id,c.amount_paisa AS expected FROM payments p JOIN challans c ON c.id=p.challan_id WHERE p.id=$1",[a.paymentId])).rows[0];
        assert(p,"Payment not found.",404);await editable(db,p.request_id);
        const current=(await db.query("SELECT status FROM payments WHERE id=$1 FOR UPDATE",[p.id])).rows[0];
        assert(current.status==="pending","This payment has already been reviewed.",409);
        if(a.outcome==="verified"){
          assert(a.bankReference&&a.bankReference.length>=4,"Enter the independent bank-record reference.");
          assert(toPaisa(a.actualAmount??"0")===p.expected,"The received amount must match the full challan. Mismatches need review.");
          await db.query("UPDATE payments SET status='verified',bank_reference=$2,verified_by=$3,verified_at=now(),note=$4 WHERE id=$1",[p.id,a.bankReference,user.id,a.note]);
          await db.query("UPDATE challans SET status='paid' WHERE id=$1",[p.challan_id]);
          await db.query("UPDATE incidents SET status='resolved',resolution='Reconciled bank payment' WHERE id IN (SELECT incident_id FROM challan_lines WHERE challan_id=$1)",[p.challan_id]);
        }else await db.query("UPDATE payments SET status='rejected',verified_by=$2,verified_at=now(),note=$3 WHERE id=$1",[p.id,user.id,a.note]);
        await audit(db,user.id,"payment."+a.outcome,a.note,p.request_id);return {message:a.outcome==="verified"?"Bank payment verified. Remaining departmental checks still apply.":"Receipt returned with your reason."};
      }
      case "approve_clearance": {
        const a=z.object({requestId:id}).parse(raw);
        const approver=(await db.query("SELECT value FROM settings WHERE key='final_approver'")).rows[0]?.value;
        assert(user.id===approver && !["student","alumni"].includes(user.role),"Only the configured final approver can issue clearance.",403);
        const r=await lockedRequest(db,a.requestId);
        if(r.status==="approved")return {message:"This clearance has already been issued."};
        assert(r.status==="under_review","This request is closed.");
        const checks=(await db.query("SELECT status FROM clearance_checks WHERE request_id=$1",[r.id])).rows;
        assert(checks.length>0&&checks.every(c=>c.status==="cleared"),"Every mandatory department must be cleared first.",409);
        assert(!(await db.query("SELECT 1 FROM incidents WHERE request_id=$1 AND status IN ('investigating','confirmed')",[r.id])).rowCount,"Outstanding issues prevent final clearance.",409);
        assert(!(await db.query("SELECT 1 FROM challans WHERE request_id=$1 AND status='issued'",[r.id])).rowCount,"An unpaid challan prevents final clearance.",409);
        await db.query("UPDATE clearance_requests SET status='approved',approved_by=$2,approved_at=now() WHERE id=$1",[r.id,user.id]);
        await db.query("INSERT INTO certificates(request_id,token,issued_by,document_snapshot) SELECT r.id,$2,$3,jsonb_build_object('student_name',u.name,'student_number',s.student_number,'program',p.name) FROM clearance_requests r JOIN students s ON s.id=r.student_id JOIN users u ON u.id=s.user_id JOIN enrollments e ON e.id=r.enrollment_id JOIN programs p ON p.id=e.program_id WHERE r.id=$1",[r.id,randomBytes(24).toString("hex"),user.id]);
        await audit(db,user.id,"clearance.approved","All mandatory checks completed. Final clearance authorized.",r.id);
        return {message:"Final clearance approved. The certificate is ready."};
      }
      case "revoke_certificate": {
        requireRole(user,"admin");
        const a=z.object({certificateId:id,note:text}).parse(raw);
        const c=(await db.query("SELECT * FROM certificates WHERE id=$1",[a.certificateId])).rows[0];assert(c,"Certificate not found.",404);
        await lockedRequest(db,c.request_id);
        await db.query("UPDATE certificates SET status='revoked',revocation_reason=$2 WHERE id=$1",[c.id,a.note]);
        await audit(db,user.id,"certificate.revoked",a.note,c.request_id);return {message:"Certificate revoked. Verification now shows its revoked status."};
      }
      case "stock_change": {
        const a=z.object({inventoryId:id,delta:z.coerce.number().int().min(-100000).max(100000).refine(x=>x!==0),note:text}).parse(raw);
        const item=(await db.query("SELECT * FROM inventory WHERE id=$1 FOR UPDATE",[a.inventoryId])).rows[0];assert(item,"Item not found.",404);
        await areaAccess(db,user,item.department_id);assert(item.quantity+a.delta>=0,"Stock cannot go below zero.");
        await db.query("UPDATE inventory SET quantity=quantity+$2 WHERE id=$1",[item.id,a.delta]);
        await db.query("INSERT INTO stock_movements(inventory_id,delta,reason,actor_id) VALUES($1,$2,$3,$4)",[item.id,a.delta,a.note,user.id]);
        await audit(db,user.id,"stock.adjusted",item.sku+": "+a.delta+"; "+a.note);return {message:"Stock movement recorded."};
      }
      case "add_inventory": {
        const a=z.object({name:text,sku:z.string().trim().min(3).max(40),departmentId:z.string(),category:z.enum(["apparatus","consumable","computer"]),quantity:z.coerce.number().int().min(0).max(100000),location:text}).parse(raw);
        await areaAccess(db,user,a.departmentId);
        const item=(await db.query("INSERT INTO inventory(name,sku,department_id,category,quantity,location) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",[a.name,a.sku,a.departmentId,a.category,a.quantity,a.location])).rows[0];
        if(a.quantity)await db.query("INSERT INTO stock_movements(inventory_id,delta,reason,actor_id) VALUES($1,$2,'Opening stock',$3)",[item.id,a.quantity,user.id]);
        await audit(db,user.id,"inventory.created",a.sku+" added to inventory.");return {message:"Inventory item added."};
      }
      case "save_settings": {
        requireRole(user,"admin");
        const a=z.object({bankName:text,accountTitle:text,accountNumber:z.string().trim().min(8).max(50),approverId:id}).parse(raw);
        assert((await db.query("SELECT 1 FROM users u JOIN user_roles r ON r.user_id=u.id WHERE u.id=$1 AND u.active AND r.role IN ('admin','accounts','staff')",[a.approverId])).rowCount,"Select an active authorized staff account.");
        await db.query("INSERT INTO settings VALUES('bank',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",[JSON.stringify({name:a.bankName,title:a.accountTitle,account:a.accountNumber,demo:demoEnabled()})]);
        await db.query("INSERT INTO settings VALUES('final_approver',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",[JSON.stringify(a.approverId)]);
        await audit(db,user.id,"settings.updated","Bank instructions and final approval assignment updated. Existing challans retain their original details.");return {message:"Settings saved for future challans and approvals."};
      }
      case "class_observation": {
        requireRole(user,"teacher");
        const a=z.object({classId:id,note:text}).parse(raw);
        assert((await db.query("SELECT 1 FROM classes WHERE id=$1 AND teacher_id=$2",[a.classId,user.id])).rowCount,"This class is not assigned to you.",403);
        await db.query("INSERT INTO class_observations(class_id,teacher_id,body) VALUES($1,$2,$3)",[a.classId,user.id,a.note]);
        await audit(db,user.id,"class.observation","Collective class observation recorded.");return {message:"Class observation saved."};
      }
      case "update_profile": {
        const a=z.object({phone:z.string().trim().regex(/^[+0-9 ()-]{0,30}$/)}).parse(raw);
        requireRole(user,"student","alumni");assert((await db.query("UPDATE students SET phone=$2 WHERE user_id=$1 RETURNING id",[user.id,a.phone])).rowCount,"Your student record has not been linked yet. Contact administration.",404);
        await audit(db,user.id,"profile.updated","Contact number updated.");return {message:"Contact details updated."};
      }
      case "set_user_active": {
        requireRole(user,"admin");
        const a=z.object({userId:id,active:z.boolean()}).parse(raw);
        assert(a.userId!==user.id,"You cannot deactivate your own account.");
        const approver=(await db.query("SELECT value FROM settings WHERE key='final_approver'")).rows[0]?.value;
        assert(a.active||a.userId!==approver,"Assign a new final approver before deactivating this account.");
        assert((await db.query("UPDATE users SET active=$2 WHERE id=$1 RETURNING id",[a.userId,a.active])).rowCount,"Account not found.",404);
        if(!a.active)await db.query("DELETE FROM sessions WHERE user_id=$1",[a.userId]);
        await audit(db,user.id,a.active?"account.reactivated":"account.deactivated","Account "+a.userId+" updated; historical records preserved.");
        return {message:a.active?"Account reactivated.":"Account deactivated and all sessions ended."};
      }
      default: throw new AppError("Unknown workflow action.");
    }
  });
}
