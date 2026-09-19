import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameFr: text("name_fr").notNull(),
  nameEn: text("name_en").notNull().default(""),
  sort: integer("sort").notNull().default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleFr: text("title_fr").notNull(),
  titleEn: text("title_en").notNull().default(""),
  description: text("description").notNull(),
  descriptionFr: text("description_fr").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  priceMAD: integer("price_mad").notNull(),
  priceUSD: integer("price_usd").notNull().default(0),
  images: text("images").array().notNull().default([]),
  categoryId: integer("category_id").references(() => categories.id),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  fileKey: text("file_key"),
  fileMime: text("file_mime").notNull().default("application/pdf"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  ref: text("ref").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  locale: text("locale").notNull().default("ar"),
  currency: text("currency").notNull().default("MAD"),
  totalMAD: integer("total_mad").notNull(),
  status: text("status").notNull().default("pending"),
  provider: text("provider").notNull().default("mock"),
  providerRef: text("provider_ref"),
  downloadCount: integer("download_count").notNull().default(0),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  title: text("title").notNull(),
  priceMAD: integer("price_mad").notNull(),
  fileKey: text("file_key").notNull(),
  qty: integer("qty").notNull().default(1),
});

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    image: text("image"),
    locale: text("locale").notNull().default("ar"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("articles_locale_slug_idx").on(t.locale, t.slug)]
);

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;