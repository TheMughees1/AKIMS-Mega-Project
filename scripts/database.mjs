import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { existsSync, mkdirSync,readFileSync,renameSync,unlinkSync } from "node:fs";
import path from "node:path";
if (process.env.APP_ENV === "production") throw new Error("Use a managed PostgreSQL server in production.");
const url = new URL(process.env.DATABASE_URL || "");
if (!["127.0.0.1","localhost"].includes(url.hostname)) throw new Error("Local launcher only supports loopback.");
mkdirSync(".local", {recursive:true});
// A restored Linux snapshot can retain zombie PIDs. PostgreSQL's kill(pid,0)
// check cannot distinguish these from live servers. Recover only our own,
// positively identified dead cluster; never unlink an active server's lock.
const pidFile=".local/postgres/postmaster.pid";
if(existsSync(pidFile)){
  const lines=readFileSync(pidFile,"utf8").trim().split("\n");
  const pid=Number(lines[0]);
  if(!Number.isInteger(pid)||pid<2||path.resolve(lines[1]||"")!==path.resolve(".local/postgres"))throw new Error("Unexpected database lock metadata; manual inspection required.");
  let dead=false;
  try{
    const stat=readFileSync("/proc/"+pid+"/stat","utf8");
    const state=stat.slice(stat.lastIndexOf(")")+2).split(" ")[0];
    dead=state==="Z"||state==="X";
  }catch(e){if(e.code==="ENOENT"&&process.platform==="linux")dead=true;else throw e;}
  if(!dead)throw new Error("The recorded database process is still active. Check connectivity without removing its lock.");
  const socketLock="/tmp/.s.PGSQL."+url.port+".lock";
  if(existsSync(socketLock)){
    const lock=readFileSync(socketLock,"utf8").trim().split("\n");
    if(Number(lock[0])!==pid||path.resolve(lock[1]||"")!==path.resolve(".local/postgres"))throw new Error("Socket lock belongs to a different cluster; leaving it untouched.");
    unlinkSync(socketLock);
  }
  renameSync(pidFile,".local/stale-postmaster-"+pid+"-"+Date.now()+".pid");
  console.log("Recovered a verified stale database lock after snapshot restoration.");
}
const database = new EmbeddedPostgres({
  databaseDir: ".local/postgres", user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password), port: Number(url.port),
  persistent: true, authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {}, onError: (message) => { if (String(message).includes("FATAL")) console.error(String(message)); }
});
if (!existsSync(".local/postgres/PG_VERSION")) await database.initialise();
await database.start();
const client = new pg.Client({connectionString: new URL("/postgres", url).toString()});
await client.connect();
const name = url.pathname.slice(1);
if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error("Invalid database name.");
if (!(await client.query("SELECT 1 FROM pg_database WHERE datname=$1", [name])).rowCount) {
  await client.query('CREATE DATABASE "' + name + '"');
}
await client.end();
console.log("AKIMS local PostgreSQL ready on loopback port " + url.port);
const stop = async () => { await database.stop(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 60_000);
