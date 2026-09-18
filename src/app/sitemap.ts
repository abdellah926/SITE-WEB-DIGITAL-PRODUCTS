import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const ROUTES = ["", "products", "articles"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["ar", "fr", "en"].flatMap((locale) =>
    ROUTES.map((route) => ({
      url: `${BASE}/${locale}/${route}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: route === "" ? 1 : 0.8,
    }))
  );
}