import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { pool, assert } from "./db";
export type Role = "student"|"staff"|"accounts"|"admin"|"teacher"|"alumni";
export type User = { id: string; name: string; email: string; role: Role };
export const tokenHash = (token:string) => createHash("sha256").update(token).digest("hex");
export async function currentUser():Promise<User|null> {
  const token=(await cookies()).get("akims_session")?.value;
  if(!token) return null;
  return (await pool.query("SELECT u.id,u.name,u.email,s.active_role AS role FROM sessions s JOIN users u ON u.id=s.user_id JOIN user_roles r ON r.user_id=u.id AND r.role=s.active_role WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active",[tokenHash(token)])).rows[0]??null;
}
export async function requireUser() {
  const user=await currentUser(); assert(user,"Please sign in to continue.",401); return user;
}
export function requireRole(user:User,...roles:Role[]) { assert(roles.includes(user.role),"You do not have access to this action.",403); }
export async function createSession(userId:string,role:Role) {
  const token=randomBytes(32).toString("hex");
  await pool.query("INSERT INTO sessions(token_hash,user_id,active_role,expires_at) VALUES($1,$2,$3,now()+interval '12 hours')",[tokenHash(token),userId,role]);
  (await cookies()).set("akims_session",token,{httpOnly:true,secure:process.env.APP_ENV==="production",sameSite:"lax",path:"/",maxAge:43200});
}
export function checkOrigin(req:Request) {
  const origin=req.headers.get("origin");
  const expected=process.env.APP_ORIGIN;
  assert(expected && origin===new URL(expected).origin,"Request origin is not permitted.",403);
}
export async function passwordLogin(email:string,password:string) {
  const key=tokenHash(email.toLowerCase());
  const attempts=await pool.query("INSERT INTO login_attempts(key,attempts,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN login_attempts.reset_at<now() THEN 1 ELSE login_attempts.attempts+1 END, reset_at=CASE WHEN login_attempts.reset_at<now() THEN now()+interval '15 minutes' ELSE login_attempts.reset_at END RETURNING attempts",[key]);
  assert(attempts.rows[0].attempts<=8,"Too many attempts. Please try again in 15 minutes.",429);
  const user=(await pool.query("SELECT u.*,r.role FROM users u JOIN user_roles r ON r.user_id=u.id WHERE lower(u.email)=$1 AND u.active ORDER BY r.role LIMIT 1",[email.toLowerCase()])).rows[0];
  const [salt,hash]=(user?.password_hash??"no-such-user:"+Buffer.alloc(64).toString("hex")).split(":");
  const actual=scryptSync(password,salt,64);
  const expected=Buffer.from(hash,"hex");
  assert(user && expected.length===actual.length && timingSafeEqual(expected,actual),"Email or password is incorrect.",401);
  await pool.query("DELETE FROM login_attempts WHERE key=$1",[key]);
  await createSession(user.id,user.role);
}
