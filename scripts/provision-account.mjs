import pg from "pg";
import {randomBytes,scryptSync} from "node:crypto";
// Supply values through the trusted execution environment, not command-line arguments.
const {AKIMS_ACCOUNT_EMAIL:email,AKIMS_ACCOUNT_PASSWORD:password,AKIMS_ACCOUNT_NAME:name,AKIMS_ACCOUNT_ROLE:role="student"}=process.env;
if(!email||!password||password.length<14)throw new Error("Set AKIMS_ACCOUNT_EMAIL and a unique AKIMS_ACCOUNT_PASSWORD of at least 14 characters in the trusted environment.");
if(!["student","staff","accounts","admin","teacher","alumni"].includes(role))throw new Error("Unknown role.");
const salt=randomBytes(16).toString("hex");const hash=salt+":"+scryptSync(password,salt,64).toString("hex");
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
await db.query("BEGIN");
try{
  let user=(await db.query("SELECT id FROM users WHERE lower(email)=$1 FOR UPDATE",[email.toLowerCase()])).rows[0];
  if(user)await db.query("UPDATE users SET password_hash=$2 WHERE id=$1",[user.id,hash]);
  else{
    if(!name)throw new Error("Set AKIMS_ACCOUNT_NAME when creating an account.");
    user=(await db.query("INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id",[name,email.toLowerCase(),hash])).rows[0];
    await db.query("INSERT INTO user_roles VALUES($1,$2)",[user.id,role]);
  }
  await db.query("DELETE FROM sessions WHERE user_id=$1",[user.id]);
  await db.query("INSERT INTO audit_events(actor_id,action,detail) VALUES($1,'account.provisioned','Account password provisioned by an authorized server operator; existing sessions revoked.')",[user.id]);
  await db.query("COMMIT");console.log("Account provisioned. Existing roles were preserved; no credentials were logged.");
}catch(e){await db.query("ROLLBACK");throw e;}finally{await db.end();}
