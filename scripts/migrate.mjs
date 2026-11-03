import pg from "pg";
import {readFile,readdir} from "node:fs/promises";
import {createHash} from "node:crypto";
const db = new pg.Client({connectionString:process.env.DATABASE_URL});
await db.connect();
try {
  await db.query("SELECT pg_advisory_lock(721033)");
  await db.query("CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
  for(const name of (await readdir("db/migrations")).filter(x=>x.endsWith(".sql")).sort()){
    const sql=await readFile("db/migrations/"+name,"utf8");
    const checksum=createHash("sha256").update(sql).digest("hex");
    const old=(await db.query("SELECT checksum FROM schema_migrations WHERE name=$1",[name])).rows[0];
    if(old){if(old.checksum!==checksum)throw new Error("Changed migration: "+name);continue;}
    await db.query("BEGIN");
    try{
      await db.query(sql);
      await db.query("INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",[name,checksum]);
      await db.query("COMMIT");
      console.log("Applied "+name);
    }catch(e){await db.query("ROLLBACK");throw e;}
  }
} finally {await db.query("SELECT pg_advisory_unlock(721033)");await db.end();}
