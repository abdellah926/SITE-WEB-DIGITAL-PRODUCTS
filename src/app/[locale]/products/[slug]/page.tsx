import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getProductBySlug, listCategories } from "@/features/catalog/queries";
import { ProductImages } from "@/components/product-images";
import { localTitle } from "@/lib/format";
import { PriceBlock } from "@/components/price";
import { TrustBlock } from "@/components/trust";

const SPEC_EMOJIS = ["📘", "📸", "🧶", "✂️", "📐", "🎓", "⚡"];

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "404" };
  return {
    title: localTitle(locale, product.title, product.titleFr, product.titleEn),
    description: localTitle(locale, product.description, product.descriptionFr, product.descriptionEn),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [t, categories] = await Promise.all([
    getTranslations("product"),
    listCategories(),
  ]);

  const title = localTitle(locale, product.title, product.titleFr, product.titleEn);
  const description = localTitle(locale, product.description, product.descriptionFr, product.descriptionEn);
  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductImages key={product.id} images={product.images} title={title} />
        <div className="flex flex-col gap-4">
          {category ? (
            <p className="text-sm text-stone-500">
              {t("categoryLabel")}: {localTitle(locale, category.name, category.nameFr, category.nameEn)}
            </p>
          ) : null}
          <h1 className="text-3xl font-bold text-stone-900">{title}</h1>
          <PriceBlock product={product} locale={locale} big />
          <p className="whitespace-pre-line text-stone-700">{description}</p>

          <section className="flex flex-col gap-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-900">
                {t("specTitle")}
              </h2>
              <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-stone-700 sm:grid-cols-2">
                {(t.raw("specItems") as string[]).map((item, i) => (
                  <li key={item} className="flex items-center gap-2">
                    <span aria-hidden="true">{SPEC_EMOJIS[i]}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-900">
                {t("perfectTitle")}
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm text-stone-700">
                {(t.raw("perfectItems") as string[]).map((item) => (
                  <li key={item} className="rounded-full bg-amber-50 px-3 py-1">
                    {item}
                  </li>
                ))}
              </ul>
              <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-stone-100 pt-3 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">{t("skillLabel")}</dt>
                  <dd className="font-medium text-stone-900">{t("skillValue")}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">{t("langLabel")}</dt>
                  <dd className="font-medium text-stone-900">{t("langValue")}</dd>
                </div>
              </dl>
            </div>
          </section>

          <TrustBlock />

          {product.fileKey ? (
            <p className="max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-amber-900">
              {t("digitalBadge")}
            </p>
          ) : null}

          {product.inStock && product.fileKey ? (
            <Link
              href={`/${locale}/products/${slug}/buy`}
              className="max-w-sm rounded-full bg-amber-700 px-6 py-3 text-center font-semibold text-white hover:bg-amber-800"
            >
              {t("buyNow")}
            </Link>
          ) : (
            <p className="max-w-sm rounded-full bg-stone-200 px-6 py-3 text-center font-medium text-stone-500">
              {t("outOfStock")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
