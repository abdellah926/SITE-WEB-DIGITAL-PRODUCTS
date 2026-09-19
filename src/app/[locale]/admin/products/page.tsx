import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listProducts } from "@/features/catalog/queries";
import { requireAdmin } from "@/features/admin/session";
import { deleteProductAction } from "@/features/admin/actions";
import { ConfirmDelete } from "@/features/admin/forms";
import { formatMAD, localTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const [t, products] = await Promise.all([getTranslations("admin"), listProducts()]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{t("totalProducts")}</h1>
        <Link
          href={`/${locale}/admin/products/new`}
          className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          {t("actions.newProduct")}
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          {t("none")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">
                  {localTitle(locale, p.title, p.titleFr, p.titleEn)}
                </p>
                <p className="text-sm text-stone-500">
                  {formatMAD(p.priceMAD, locale)} ·{" "}
                  {p.inStock ? "✓" : "–"} · {p.slug}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/${locale}/admin/products/${p.id}`}
                  className="text-sm text-amber-800 hover:underline"
                >
                  {t("actions.edit")}
                </Link>
                <ConfirmDelete action={deleteProductAction} id={p.id} label={t("actions.delete")} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}