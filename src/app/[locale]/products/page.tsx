import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  listCategories,
  listProducts,
  listProductsByCategory,
} from "@/features/catalog/queries";
import { ProductCard } from "@/components/product-card";
import { localTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [t, mt] = await Promise.all([getTranslations("nav"), getTranslations("meta")]);
  return {
    title: `${t("products")} | ${mt("siteName")}`,
    description: mt("description"),
    keywords: mt("keywords"),
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;

  const [t, tEmpty, categories] = await Promise.all([
    getTranslations("nav"),
    getTranslations("product"),
    listCategories(),
  ]);

  const selected = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;
  const products = selected
    ? await listProductsByCategory(selected.id)
    : await listProducts();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("products")}</h1>

      <nav className="flex flex-wrap gap-2">
        <Link
          href={`/${locale}/products`}
          className={
            "rounded-full border px-4 py-1.5 text-sm " +
            (selected
              ? "border-stone-300 text-stone-600 hover:border-amber-700"
              : "border-amber-700 bg-amber-700 text-white")
          }
        >
          {locale === "ar" ? "الكل" : locale === "fr" ? "Tous" : "All"}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/${locale}/products?category=${c.slug}`}
            className={
              "rounded-full border px-4 py-1.5 text-sm " +
              (selected?.id === c.id
                ? "border-amber-700 bg-amber-700 text-white"
                : "border-stone-300 text-stone-600 hover:border-amber-700")
            }
          >
            {localTitle(locale, c.name, c.nameFr, c.nameEn)}
          </Link>
        ))}
      </nav>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} locale={locale as "en"} product={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center">
          <h2 className="text-lg font-semibold">{tEmpty("emptyTitle")}</h2>
          <p className="mt-1 text-sm text-stone-600">{tEmpty("emptyBody")}</p>
        </div>
      )}
    </div>
  );
}