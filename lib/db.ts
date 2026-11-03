import { Pool, PoolClient } from "pg";
const globalDB = globalThis as unknown as { akimsPool?: Pool };
export const pool = globalDB.akimsPool ?? new Pool({
  connectionString: process.env.DATABASE_URL, max: 8,
  connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000
});
globalDB.akimsPool = pool;
export async function transaction<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  try { await db.query("BEGIN"); const value = await fn(db); await db.query("COMMIT"); return value; }
  catch(e) { await db.query("ROLLBACK"); throw e; }
  finally { db.release(); }
}
export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function assert(condition: unknown, message: string, status=400): asserts condition {
  if(!condition) throw new AppError(message,status);
}
export async function audit(db: PoolClient, actor: string, action: string, detail: string, request: string|null=null) {
  await db.query("INSERT INTO audit_events(actor_id,action,detail,request_id) VALUES($1,$2,$3,$4)",[actor,action,detail,request]);
}
export const demoEnabled = () => process.env.DEMO_MODE === "true" && process.env.APP_ENV !== "production";
