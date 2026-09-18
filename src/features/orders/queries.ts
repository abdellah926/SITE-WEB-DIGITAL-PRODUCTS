import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orderItems, orders } from "@/lib/db/schema";
import type { Order, OrderItem } from "@/lib/db/schema";
import { newRef } from "./ref";

export type OrderWithItems = Order & { items: OrderItem[] };

export async function createOrder(args: {
  name: string;
  email: string;
  locale: "ar" | "fr";
  totalMAD: number;
  provider: "cmi" | "mock";
  item: { productId: number; title: string; priceMAD: number; fileKey: string };
}): Promise<Order | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const ref = newRef();
    const [order] = await db
      .insert(orders)
      .values({
        ref,
        name: args.name.trim(),
        email: args.email.trim().toLowerCase(),
        locale: args.locale,
        totalMAD: args.totalMAD,
        provider: args.provider,
      })
      .returning();
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: args.item.productId,
      title: args.item.title,
      priceMAD: args.item.priceMAD,
      fileKey: args.item.fileKey,
    });
    return order;
  } catch {
    return null;
  }
}

export async function getOrderByRef(ref: string): Promise<OrderWithItems | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const [order] = await db.select().from(orders).where(eq(orders.ref, ref));
    if (!order) return null;
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    return { ...order, items };
  } catch {
    return null;
  }
}

export async function listOrders(): Promise<OrderWithItems[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const items = await db.select().from(orderItems);
    return rows.map((row) => ({
      ...row,
      items: items.filter((i) => i.orderId === row.id),
    }));
  } catch {
    return [];
  }
}

export async function countAllOrders(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  try {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(orders);
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function markPaid(orderId: number, providerRef?: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db
      .update(orders)
      .set({ status: "paid", paidAt: new Date(), providerRef: providerRef ?? null, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    return true;
  } catch {
    return false;
  }
}

export async function markFailed(orderId: number, providerRef?: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db
      .update(orders)
      .set({ status: "failed", providerRef: providerRef ?? null, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    return true;
  } catch {
    return false;
  }
}

export async function incrementDownloads(orderId: number): Promise<number | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const [order] = await db
      .update(orders)
      .set({ downloadCount: sql`${orders.downloadCount} + 1`, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning({ count: orders.downloadCount });
    return order?.count ?? null;
  } catch {
    return null;
  }
}