import {spawnSync} from "node:child_process";
import {pauseLocalWeb,resumeLocalWeb} from "./local-web-control.mjs";
const paused=await pauseLocalWeb();let code=1;
try{code=spawnSync(process.execPath,["node_modules/next/dist/bin/next","build","--webpack"],{stdio:"inherit",env:{...process.env,NEXT_TELEMETRY_DISABLED:"1"}}).status??1;}
finally{resumeLocalWeb(paused);}
process.exitCode=code;
