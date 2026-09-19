import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listAllArticles } from "@/features/content/queries";
import { requireAdmin } from "@/features/admin/session";
import { deleteArticleAction } from "@/features/admin/actions";
import { ConfirmDelete } from "@/features/admin/forms";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const [t, articles] = await Promise.all([getTranslations("admin"), listAllArticles()]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{t("totalArticles")}</h1>
        <Link
          href={`/${locale}/admin/articles/new`}
          className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          {t("actions.newArticle")}
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          {t("none")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {articles.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">{a.title}</p>
                <p className="text-sm text-stone-500">
                  {a.locale ===  "en"} · {a.slug}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/${locale}/admin/articles/${a.id}`}
                  className="text-sm text-amber-800 hover:underline"
                >
                  {t("actions.edit")}
                </Link>
                <ConfirmDelete action={deleteArticleAction} id={a.id} label={t("actions.delete")} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}