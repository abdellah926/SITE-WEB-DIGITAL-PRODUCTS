import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getProductBySlug } from "@/features/catalog/queries";
import { formatMAD } from "@/lib/format";
import { BuyForm } from "@/components/buy-form";

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
    title: `${locale === "fr" ? product.titleFr : product.title} — achat`,
    robots: { index: false, follow: true },
  };
}

export default async function BuyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.fileKey) notFound();

  const [t] = await Promise.all([getTranslations("order")]);
  const title = locale === "fr" ? product.titleFr : product.title;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("checkoutTitle")}</h1>
      <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
        <div>
          <p className="font-medium text-stone-900">{title}</p>
          <p className="text-sm text-stone-500">{t("summaryTitle")}</p>
        </div>
        <p className="font-bold text-amber-800">{formatMAD(product.priceMAD, locale as "ar" | "fr")}</p>
      </div>
      <BuyForm
        locale={locale as "ar" | "fr"}
        slug={slug}
        priceText={formatMAD(product.priceMAD, locale as "ar" | "fr")}
      />
    </div>
  );
}