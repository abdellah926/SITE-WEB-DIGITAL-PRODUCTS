import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { articles } from "@/lib/db/schema";
import { log } from "@/lib/log";
import type { Article } from "@/lib/db/schema";

export async function listArticles(locale: string): Promise<Article[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.locale, locale))
      .orderBy(desc(articles.publishedAt));
  } catch (err) {
    log("error", "listArticles failed", String(err));
    return [];
  }
}

export async function getArticleBySlug(locale: string, slug: string): Promise<Article | null> {
  const db = getDb();
  if (!db) return null;
  try {
    return (
      await db
        .select()
        .from(articles)
        .where(and(eq(articles.locale, locale), eq(articles.slug, slug)))
    )[0] ?? null;
  } catch (err) {
    log("error", "getArticleBySlug failed", String(err));
    return null;
  }
}

export async function listLatestArticles(locale: string, limit = 3): Promise<Article[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.locale, locale))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);
  } catch (err) {
    log("error", "listLatestArticles failed", String(err));
    return [];
  }
}

export async function countAllContent(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  try {
    const rows = await db.select({ n: articles.id }).from(articles);
    return rows.length;
  } catch (err) {
    log("error", "countAllContent failed", String(err));
    return 0;
  }
}

export async function listAllArticles(): Promise<Article[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(articles).orderBy(desc(articles.publishedAt));
  } catch (err) {
    log("error", "listAllArticles failed", String(err));
    return [];
  }
}

export async function getArticleById(id: number): Promise<Article | null> {
  const db = getDb();
  if (!db) return null;
  try {
    return (await db.select().from(articles).where(eq(articles.id, id)))[0] ?? null;
  } catch (err) {
    log("error", "getArticleById failed", String(err));
    return null;
  }
}