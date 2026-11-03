import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { checkOrigin,createSession,passwordLogin,tokenHash } from "@/lib/auth";
import { assert,demoEnabled,pool } from "@/lib/db";
import { failure } from "@/lib/http";
export async function POST(req:Request) {
  try {
    checkOrigin(req);
    const a=z.object({action:z.enum(["login","logout","demo"]),email:z.string().email().optional(),password:z.string().min(1).max(256).optional(),profile:z.enum(["student","student-alt","staff","accounts","admin","teacher","alumni"]).optional()}).parse(await req.json());
    const old=(await cookies()).get("akims_session")?.value;
    if(a.action==="logout"){
      if(old)await pool.query("DELETE FROM sessions WHERE token_hash=$1",[tokenHash(old)]);
      (await cookies()).delete("akims_session");
    }else if(a.action==="demo"){
      assert(demoEnabled(),"Demonstration sign-in is disabled.",403);assert(a.profile,"Choose a demonstration account.");
      const u=(await pool.query("SELECT u.id,r.role FROM users u JOIN user_roles r ON r.user_id=u.id WHERE u.email=$1 AND u.active",[a.profile+"@demo.akims.test"])).rows[0];
      assert(u,"Demo data has not been initialized.");await createSession(u.id,u.role);
      if(old)await pool.query("DELETE FROM sessions WHERE token_hash=$1",[tokenHash(old)]);
    }else{
      assert(a.email&&a.password,"Enter your email and password.");
      await passwordLogin(a.email,a.password);
      if(old)await pool.query("DELETE FROM sessions WHERE token_hash=$1",[tokenHash(old)]);
    }
    return NextResponse.json({ok:true});
  }catch(e){return failure(e);}
}
