import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/features/admin/session";
import { ArticleForm } from "@/features/admin/forms";

export const dynamic = "force-dynamic";

export default async function AdminNewArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const t = await getTranslations("admin");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("actions.newArticle")}</h1>
      <ArticleForm />
    </div>
  );
}