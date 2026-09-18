import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getArticleById } from "@/features/content/queries";
import { requireAdmin } from "@/features/admin/session";
import { ArticleForm } from "@/features/admin/forms";

export const dynamic = "force-dynamic";

export default async function AdminEditArticlePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireAdmin(locale);
  const [t, article] = await Promise.all([
    getTranslations("admin"),
    getArticleById(Number(id)).catch(() => null),
  ]);
  if (!article || !/^\d+$/.test(id)) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{t("actions.edit")}</h1>
        <Link href={`/${locale}/admin/articles`} className="text-sm text-amber-800 hover:underline">
          {t("backToList")}
        </Link>
      </div>
      <ArticleForm article={article} />
    </div>
  );
}