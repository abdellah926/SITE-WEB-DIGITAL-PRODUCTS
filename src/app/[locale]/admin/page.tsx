import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { countAllCatalog } from "@/features/catalog/queries";
import { countAllContent } from "@/features/content/queries";
import { requireAdmin } from "@/features/admin/session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const [t, counts, articleCount] = await Promise.all([
    getTranslations("admin"),
    countAllCatalog(),
    countAllContent(),
  ]);

  const issues: string[] = [];
  if (!process.env.DATABASE_URL) issues.push(t("noDb"));
  if (!process.env.NEXT_PUBLIC_SHOP_PHONE) issues.push(t("phoneMissing"));

  const cards = [
    { label: t("totalProducts"), value: counts.products, href: `/${locale}/admin/products` },
    { label: t("totalArticles"), value: articleCount, href: `/${locale}/admin/articles` },
    { label: t("totalCategories"), value: counts.categories, href: `/${locale}/admin/categories` },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("title")}</h1>

      {issues.map((issue) => (
        <p key={issue} className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {issue}
        </p>
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <p className="text-3xl font-bold text-amber-800">{c.value}</p>
            <p className="mt-1 font-medium text-stone-700">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}