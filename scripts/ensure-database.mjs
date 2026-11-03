import pg from "pg";
import {spawn} from "node:child_process";
import {mkdirSync,openSync,closeSync,writeFileSync} from "node:fs";
const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error("Set DATABASE_URL before starting the database.");
async function ready(){
  const c=new pg.Client({connectionString,connectionTimeoutMillis:1000});
  try{await c.connect();await c.query("SELECT 1");return true;}catch{return false;}finally{await c.end().catch(()=>{});}
}
if(await ready()){console.log("Database connection verified.");process.exit(0);}
const url=new URL(connectionString);
if(process.env.APP_ENV==="production"||!["localhost","127.0.0.1"].includes(url.hostname))throw new Error("Configured database is unavailable. Check the managed service and credentials; local startup was not attempted.");
mkdirSync(".local",{recursive:true,mode:0o700});
const log=openSync(".local/database.log","a",0o600);
const child=spawn(process.execPath,["--env-file-if-exists=.env.local","scripts/database.mjs"],{detached:true,stdio:["ignore",log,log],env:process.env});
writeFileSync(".local/database-runner.pid",String(child.pid),{mode:0o600});child.unref();closeSync(log);
for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,1000));if(await ready()){console.log("Local PostgreSQL started and verified.");process.exit(0);}}
throw new Error("Local database did not become ready. Inspect .local/database.log; do not remove an active server's lock files.");
