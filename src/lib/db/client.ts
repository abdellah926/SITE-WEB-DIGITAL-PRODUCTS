import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { log } from "@/lib/log";
import * as schema from "./schema";

let pool: Pool | null = null;

export function getDb(): ReturnType<typeof drizzle<typeof schema>> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 5 });
    pool.on("error", (err) => log("error", "pg pool error", err.message));
  }
  return drizzle(pool, { schema });
}