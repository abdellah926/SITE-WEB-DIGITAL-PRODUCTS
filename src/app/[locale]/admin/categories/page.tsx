import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listCategories } from "@/features/catalog/queries";
import { requireAdmin } from "@/features/admin/session";
import { deleteCategoryAction } from "@/features/admin/actions";
import { CategoryForm, ConfirmDelete } from "@/features/admin/forms";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const [t, categories] = await Promise.all([getTranslations("admin"), listCategories()]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("totalCategories")}</h1>
      <CategoryForm />

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          {t("none")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium text-stone-900">
                  {locale === "fr" ? c.nameFr : c.name}{" "}
                  <span className="text-sm text-stone-400">({c.slug})</span>
                </p>
                <p className="text-sm text-stone-500">
                  {c.name} · {c.nameFr}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/${locale}/admin/categories/${c.id}`}
                  className="text-sm text-amber-800 hover:underline"
                >
                  {t("actions.edit")}
                </Link>
                <ConfirmDelete action={deleteCategoryAction} id={c.id} label={t("actions.delete")} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}