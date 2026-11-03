import { pool } from "@/lib/db";
export async function GET(){
  try{const schema=await pool.query("SELECT 1 FROM schema_migrations WHERE name='004_certificate_snapshot.sql'");if(!schema.rowCount)throw new Error("Migrations pending");return Response.json({status:"ok",application:"akims-campus",database:"connected"},{headers:{"Cache-Control":"no-store"}});}
  catch{return Response.json({status:"unavailable"},{status:503});}
}
