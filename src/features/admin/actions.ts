"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { articles, categories, products } from "@/lib/db/schema";
import { log } from "@/lib/log";
import { slugify } from "@/lib/format";
import { markPaid } from "@/features/orders/queries";
import { ADMIN_COOKIE, issueToken, isAdmin, passwordOk } from "./session";

export interface FormState {
  error?: string;
  saved?: boolean;
}

const required = z.string().trim().min(1);
const slugField = required.regex(/^[a-z0-9-]+$/, "slugInvalid");
const boolField = z
  .union([z.literal("on"), z.literal(null), z.undefined()])
  .transform((v) => v === "on");
const nullableId = z
  .union([z.literal(""), z.string().regex(/^\d+$/)])
  .transform((v) => (v === "" ? null : Number(v)));

const productSchema = z.object({
  title: required.max(120),
  titleFr: required.max(120),
  titleEn: z.string().trim().max(120).default(""),
  slug: slugField.max(160),
  description: required.max(3000),
  descriptionFr: required.max(3000),
  descriptionEn: z.string().trim().max(3000).default(""),
  priceMAD: z.coerce.number().int().min(0).max(100000),
  priceUSD: z.number().int().min(0).max(10000000).default(0),
  categoryId: nullableId,
  inStock: boolField,
  featured: boolField,
});

const articleSchema = z.object({
  title: required.max(200),
  slug: slugField.max(160),
  excerpt: required.max(300),
  body: required.max(20000),
  locale: z.enum(["ar", "fr"]),
  image: z.string().trim().max(500).optional(),
});

const categorySchema = z.object({
  slug: slugField.max(120),
  name: required.max(120),
  nameFr: required.max(120),
  nameEn: z.string().trim().max(120).default(""),
  sort: z.coerce.number().int().min(0).max(9999),
});

function splitImages(raw: unknown): string[] {
  return String(raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function guard(): Promise<{ error?: never } | { error: "unauthorized" }> {
  if (!(await isAdmin())) return { error: "unauthorized" };
  return {};
}

/* ---------- auth ---------- */

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const attempts = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < LOGIN_WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > LOGIN_MAX_ATTEMPTS;
}

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const locale = String(formData.get("locale") ?? "ar");
  const password = String(formData.get("password") ?? "");
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    log("warn", "admin login rate-limited", { ip });
    return { error: "invalidPassword" };
  }
  if (!passwordOk(password)) {
    log("warn", "admin login rejected");
    return { error: "invalidPassword" };
  }
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, issueToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
  const okLocale = ["ar", "fr", "en"].includes(locale) ? locale : "ar";
  log("info", "admin logged in");
  redirect(`/${okLocale}/admin`);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/ar");
}

/* ---------- orders ---------- */

export async function markOrderPaidAction(formData: FormData): Promise<void> {
  const g = await guard();
  if (g.error) redirect("/ar/admin/login");
  const id = String(formData.get("id") ?? "");
  const locale = ["ar", "fr", "en"].includes(String(formData.get("locale") ?? "ar"))
    ? String(formData.get("locale"))
    : "ar";
  if (/^\d+$/.test(id)) {
    const ok = await markPaid(Number(id), "manual-admin");
    if (ok) {
      log("info", "order marked paid manually", { id });
      revalidatePath("/", "layout");
    }
  }
  redirect(`/${locale}/admin/orders`);
}

/* ---------- products ---------- */

async function dbErr(err: unknown): Promise<FormState> {
  log("error", "db mutation failed", String(err));
  return { error: "dbDown" };
}

export async function saveProductAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const g = await guard();
  if (g.error) return { error: "unauthorized" };
  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    titleFr: formData.get("titleFr"),
    titleEn: formData.get("titleEn") || undefined,
    slug: formData.get("slug"),
    description: formData.get("description"),
    descriptionFr: formData.get("descriptionFr"),
    descriptionEn: formData.get("descriptionEn") || undefined,
    priceMAD: formData.get("priceMAD"),
    priceUSD: Math.round((Number(formData.get("priceUSD")) || 0) * 100),
    categoryId: formData.get("categoryId"),
    inStock: formData.get("inStock"),
    featured: formData.get("featured"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.code ?? "";
    return { error: msg === "custom" ? parsed.error.issues[0]?.message : "required" };
  }
  const db = getDb();
  if (!db) return { error: "dbDown" };
  const raw = parsed.data;
  const images = splitImages(formData.get("images"));
  const id = String(formData.get("id") ?? "");
  try {
    if (id && /^\d+$/.test(id)) {
      await db
        .update(products)
        .set({ ...raw, images, updatedAt: new Date() })
        .where(eq(products.id, Number(id)));
    } else {
      await db.insert(products).values({
        ...raw,
        slug: raw.slug || slugify(raw.title),
        images,
      });
    }
  } catch (err) {
    return dbErr(err);
  }
  log("info", "product saved", { id, slug: raw.slug });
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const g = await guard();
  if (g.error) redirect("/ar/admin/login");
  const id = String(formData.get("id") ?? "");
  const db = getDb();
  if (db && /^\d+$/.test(id)) {
    try {
      await db.delete(products).where(eq(products.id, Number(id)));
      log("info", "product deleted", { id });
      revalidatePath("/", "layout");
    } catch (err) {
      log("error", "product delete failed", String(err));
    }
  }
  redirect("/ar/admin/products");
}

/* ---------- categories ---------- */

export async function saveCategoryAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const g = await guard();
  if (g.error) return { error: "unauthorized" };
  const parsed = categorySchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    nameFr: formData.get("nameFr"),
    nameEn: formData.get("nameEn") || undefined,
    sort: formData.get("sort"),
  });
  if (!parsed.success) return { error: "required" };
  const db = getDb();
  if (!db) return { error: "dbDown" };
  const id = String(formData.get("id") ?? "");
  try {
    if (id && /^\d+$/.test(id)) {
      await db.update(categories).set(parsed.data).where(eq(categories.id, Number(id)));
    } else {
      await db.insert(categories).values(parsed.data);
    }
  } catch (err) {
    return dbErr(err);
  }
  log("info", "category saved", { id });
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const g = await guard();
  if (g.error) redirect("/ar/admin/login");
  const id = String(formData.get("id") ?? "");
  const db = getDb();
  if (db && /^\d+$/.test(id)) {
    try {
      await db.delete(categories).where(eq(categories.id, Number(id)));
      log("info", "category deleted", { id });
      revalidatePath("/", "layout");
    } catch (err) {
      log("error", "category delete failed", String(err));
    }
  }
  redirect("/ar/admin/categories");
}

/* ---------- articles ---------- */

export async function saveArticleAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const g = await guard();
  if (g.error) return { error: "unauthorized" };
  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    locale: formData.get("locale"),
    image: formData.get("image") || undefined,
  });
  if (!parsed.success) return { error: "required" };
  const db = getDb();
  if (!db) return { error: "dbDown" };
  const id = String(formData.get("id") ?? "");
  const image = parsed.data.image || "/img/article-default.svg";
  try {
    if (id && /^\d+$/.test(id)) {
      await db
        .update(articles)
        .set({ ...parsed.data, image })
        .where(eq(articles.id, Number(id)));
    } else {
      await db.insert(articles).values({ ...parsed.data, image });
    }
  } catch (err) {
    return dbErr(err);
  }
  log("info", "article saved", { id, slug: parsed.data.slug });
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  const g = await guard();
  if (g.error) redirect("/ar/admin/login");
  const id = String(formData.get("id") ?? "");
  const db = getDb();
  if (db && /^\d+$/.test(id)) {
    try {
      await db.delete(articles).where(eq(articles.id, Number(id)));
      log("info", "article deleted", { id });
      revalidatePath("/", "layout");
    } catch (err) {
      log("error", "article delete failed", String(err));
    }
  }
  redirect("/ar/admin/articles");
}