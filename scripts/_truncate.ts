import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

async function main() {
  const db = getDb();
  if (!db) process.exit(1);
  await db.execute(sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE email IN ('e2e@test.co','rib@test.co'))`);
  const d2 = await db.execute(sql`DELETE FROM orders WHERE email IN ('e2e@test.co','rib@test.co')`);
  console.log(`cleanup ok orders=${d2.rowCount}`);
}
main().catch((e) => {
  console.log(String(e));
  process.exit(1);
});