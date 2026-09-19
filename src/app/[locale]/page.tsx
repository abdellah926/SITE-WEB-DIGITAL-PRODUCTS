import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import { listFeaturedProducts, listProducts } from "@/features/catalog/queries";
import { listLatestArticles } from "@/features/content/queries";
import { ProductCard } from "@/components/product-card";
import { ArticleCard } from "@/components/article-card";
import { GalleryMontage } from "@/components/gallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("siteName"),
    description: t("description"),
    keywords: t("keywords"),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, featured, articles, allProducts] = await Promise.all([
    getTranslations("home"),
    listFeaturedProducts(),
    listLatestArticles(locale),
    listProducts(),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="flex flex-col items-center gap-4 rounded-2xl bg-amber-100/60 px-6 py-14 text-center">
        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
          {t("heroTitle")}
        </h1>
        <p className="max-w-2xl text-stone-700">{t("heroSubtitle")}</p>
        <Link
          href={`/${locale}/products`}
          className="rounded-full bg-amber-700 px-6 py-3 font-medium text-white hover:bg-amber-800"
        >
          {t("browseButton")}
        </Link>
      </section>

      {allProducts.length > 0 ? (
        <GalleryMontage locale={locale as  "en"} products={allProducts} />
      ) : null}

      {featured.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-900">{t("featuredTitle")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} locale={locale as "en"} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-900">{t("latestTitle")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} locale={locale as  "en"} article={a} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}