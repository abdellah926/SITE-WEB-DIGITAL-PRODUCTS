import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { categories, products } from "@/lib/db/schema";
import { log } from "@/lib/log";
import type { Category, Product } from "@/lib/db/schema";

const COUNT = sql<number>`count(*)::int`;

export async function listCategories(): Promise<Category[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(categories).orderBy(asc(categories.sort));
  } catch (err) {
    log("error", "listCategories failed", String(err));
    return [];
  }
}

export async function listProducts(): Promise<Product[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(products)
      .orderBy(desc(products.featured), desc(products.createdAt));
  } catch (err) {
    log("error", "listProducts failed", String(err));
    return [];
  }
}

export async function listProductsByCategory(categoryId: number): Promise<Product[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(desc(products.createdAt));
  } catch (err) {
    log("error", "listProductsByCategory failed", String(err));
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = getDb();
  if (!db) return null;
  try {
    return (await db.select().from(products).where(eq(products.slug, slug)))[0] ?? null;
  } catch (err) {
    log("error", "getProductBySlug failed", String(err));
    return null;
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  const db = getDb();
  if (!db) return null;
  try {
    return (await db.select().from(products).where(eq(products.id, id)))[0] ?? null;
  } catch (err) {
    log("error", "getProductById failed", String(err));
    return null;
  }
}

export async function listFeaturedProducts(): Promise<Product[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.inStock, true), eq(products.featured, true)))
      .orderBy(desc(products.createdAt))
      .limit(4);
  } catch (err) {
    log("error", "listFeaturedProducts failed", String(err));
    return [];
  }
}

export async function countAllCatalog(): Promise<{ products: number; categories: number }> {
  const db = getDb();
  if (!db) return { products: 0, categories: 0 };
  try {
    const p = await db.select({ n: COUNT }).from(products);
    const c = await db.select({ n: COUNT }).from(categories);
    return { products: p[0]?.n ?? 0, categories: c[0]?.n ?? 0 };
  } catch (err) {
    log("error", "countAllCatalog failed", String(err));
    return { products: 0, categories: 0 };
  }
}