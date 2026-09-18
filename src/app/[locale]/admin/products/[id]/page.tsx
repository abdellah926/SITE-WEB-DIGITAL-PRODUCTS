import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProductById, listCategories } from "@/features/catalog/queries";
import { requireAdmin } from "@/features/admin/session";
import { ProductForm } from "@/features/admin/forms";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireAdmin(locale);
  const [t, categories, product] = await Promise.all([
    getTranslations("admin"),
    listCategories(),
    getProductById(Number(id)),
  ]);
  if (!product || !/^\d+$/.test(id)) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{t("actions.edit")}</h1>
        <Link href={`/${locale}/admin/products`} className="text-sm text-amber-800 hover:underline">
          {t("backToList")}
        </Link>
      </div>
      <ProductForm locale={locale} product={product} categories={categories} />
    </div>
  );
}