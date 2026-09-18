import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getProductBySlug, listCategories } from "@/features/catalog/queries";
import { WatermarkedImage } from "@/components/watermarked-image";
import { formatMAD } from "@/lib/format";

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
    title: locale === "fr" ? product.titleFr : product.title,
    description: locale === "fr" ? product.descriptionFr : product.description,
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

  const title = locale === "fr" ? product.titleFr : product.title;
  const description = locale === "fr" ? product.descriptionFr : product.description;
  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <WatermarkedImage
          src={product.images[0] ?? "/img/crochet-blanket.svg"}
          alt={title}
          width={800}
          height={600}
          className="w-full rounded-2xl border border-stone-200 object-cover"
        />
        <div className="flex flex-col gap-4">
          {category ? (
            <p className="text-sm text-stone-500">
              {t("categoryLabel")}: {locale === "fr" ? category.nameFr : category.name}
            </p>
          ) : null}
          {category ? (
            <p className="text-sm text-stone-500">
              {t("categoryLabel")}: {locale === "fr" ? category.nameFr : category.name}
            </p>
          ) : null}
          <h1 className="text-3xl font-bold text-stone-900">{title}</h1>
          <p className="text-2xl font-bold text-amber-800">
            {formatMAD(product.priceMAD, locale)}
          </p>
          <p className="whitespace-pre-line text-stone-700">{description}</p>

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