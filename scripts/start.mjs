import {spawn,spawnSync} from "node:child_process";
import {mkdirSync,openSync,closeSync,writeFileSync} from "node:fs";
if(process.env.APP_ENV==="production")throw new Error("Use npm run build and npm start under a process manager in production.");
const origin=new URL(process.env.APP_ORIGIN||"http://localhost:3000");
if(!["localhost","127.0.0.1"].includes(origin.hostname))throw new Error("The local starter requires a loopback APP_ORIGIN.");
const db=spawnSync(process.execPath,["--env-file-if-exists=.env.local","scripts/ensure-database.mjs"],{stdio:"inherit",env:process.env});
if(db.status!==0)process.exit(db.status||1);
async function ready(){
  try{const r=await fetch(new URL("/api/health",origin),{signal:AbortSignal.timeout(1500)});return r.ok&&(await r.json()).application==="akims-campus";}catch{return false;}
}
if(await ready()){console.log("AKIMS web service and database are already healthy.");process.exit(0);}
mkdirSync(".local",{recursive:true,mode:0o700});const log=openSync(".local/web.log","a",0o600);
const child=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1","--port",origin.port||"3000"],{detached:true,stdio:["ignore",log,log],env:{...process.env,NEXT_TELEMETRY_DISABLED:"1"}});
writeFileSync(".local/web.pid",String(child.pid),{mode:0o600});child.unref();closeSync(log);
for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,1000));if(await ready()){console.log("AKIMS web service is ready; database-backed health check passed.");process.exit(0);}}
throw new Error("AKIMS did not become ready. Inspect .local/web.log and verify the configured port is free.");
