import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { listArticles } from "@/features/content/queries";
import { ArticleCard } from "@/components/article-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "en" ? "Articles & tutorials" : "Articles & tutorials" };
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tEmpty, articles] = await Promise.all([
    getTranslations("nav"),
    getTranslations("article"),
    listArticles(locale),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("articles")}</h1>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} locale={locale as  "en"} article={a} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center">
          <h2 className="text-lg font-semibold">{tEmpty("emptyTitle")}</h2>
          <p className="mt-1 text-sm text-stone-600">{tEmpty("emptyBody")}</p>
        </div>
      )}
    </div>
  );
}