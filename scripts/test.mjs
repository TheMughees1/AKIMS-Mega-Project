import pg from "pg";
import {randomBytes} from "node:crypto";
import {spawnSync} from "node:child_process";
import {pauseLocalWeb,resumeLocalWeb} from "./local-web-control.mjs";
if(process.env.APP_ENV==="production")throw new Error("Integration tests require a separate development PostgreSQL instance.");
const url=new URL(process.env.DATABASE_URL||"");
if(!["localhost","127.0.0.1"].includes(url.hostname))throw new Error("Test database creation is restricted to a local PostgreSQL server.");
const database="akims_test_"+randomBytes(6).toString("hex");
const admin=new pg.Client({connectionString:new URL("/postgres",url).toString()});await admin.connect();
await admin.query('CREATE DATABASE "'+database+'"');
const paused=await pauseLocalWeb();
url.pathname="/"+database;
const env={...process.env,DATABASE_URL:url.toString(),TEST_DATABASE_URL:url.toString(),APP_ENV:"test",DEMO_MODE:"true",APP_ORIGIN:"http://localhost:3100",NEXT_DIST_DIR:".next-test",STORAGE_DIR:".local/test-uploads/"+database,NEXT_TELEMETRY_DISABLED:"1"};
let status=1;
try{
  for(const script of ["scripts/migrate.mjs","scripts/seed.mjs"]){
    const run=spawnSync(process.execPath,[script],{env,stdio:"inherit"});
    if(run.status!==0)throw new Error("Test prerequisite failed: "+script);
  }
  status=spawnSync(process.execPath,["node_modules/@playwright/test/cli.js","test",...process.argv.slice(2)],{env,stdio:"inherit"}).status??1;
}finally{
  try{await admin.query('DROP DATABASE "'+database+'" WITH (FORCE)');}finally{await admin.end();resumeLocalWeb(paused);}
}
process.exitCode=status;
