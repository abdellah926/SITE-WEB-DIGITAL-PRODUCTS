import { getTranslations } from "next-intl/server";
import { listCategories } from "@/features/catalog/queries";
import { requireAdmin } from "@/features/admin/session";
import { ProductForm } from "@/features/admin/forms";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const [t, categories] = await Promise.all([getTranslations("admin"), listCategories()]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("actions.newProduct")}</h1>
      <ProductForm locale={locale} categories={categories} />
    </div>
  );
}