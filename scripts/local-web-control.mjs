import {readFileSync,existsSync} from "node:fs";
import {spawnSync} from "node:child_process";
export async function pauseLocalWeb(){
  if(!existsSync(".local/web.pid")||process.platform!=="linux")return false;
  const pid=Number(readFileSync(".local/web.pid","utf8"));
  if(!Number.isInteger(pid)||pid<2)return false;
  let command;
  try{command=readFileSync("/proc/"+pid+"/cmdline","utf8");}catch{return false;}
  if(!command.includes("node_modules/next/dist/bin/next"))return false;
  const stat=readFileSync("/proc/"+pid+"/stat","utf8");
  const fields=stat.slice(stat.lastIndexOf(")")+2).split(" ");
  if(Number(fields[2])!==pid)return false; // Only the detached process group we created.
  process.kill(-pid,"SIGTERM");
  for(let i=0;i<30;i++){
    await new Promise(r=>setTimeout(r,100));
    try{const current=readFileSync("/proc/"+pid+"/stat","utf8");if(current.slice(current.lastIndexOf(")")+2).startsWith("Z"))break;}catch{break;}
  }
  console.log("Paused the helper-managed development server to isolate generated Next.js types.");
  return true;
}
export function resumeLocalWeb(wasRunning){
  if(!wasRunning)return;
  const result=spawnSync(process.execPath,["--env-file-if-exists=.env.local","scripts/start.mjs"],{env:process.env,stdio:"inherit"});
  if(result.status!==0)throw new Error("The check completed, but the local development server could not be restored.");
}
