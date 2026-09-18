import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getArticleBySlug } from "@/features/content/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(locale, slug);
  if (!article) return { title: "404" };
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(locale, slug);
  if (!article) notFound();

  const [t, tArt] = await Promise.all([
    getTranslations("nav"),
    getTranslations("article"),
  ]);

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold leading-tight text-stone-900">{article.title}</h1>
      <p className="text-lg text-stone-600">{article.excerpt}</p>

      {article.image ? (
        <Image
          src={article.image}
          alt={article.title}
          width={1200}
          height={600}
          unoptimized
          className="w-full rounded-2xl border border-stone-200 object-cover"
        />
      ) : null}

      <div className="whitespace-pre-line leading-8 text-stone-800">{article.body}</div>

      <aside className="mt-4 flex flex-col gap-3 rounded-2xl bg-amber-100/60 p-6">
        <h2 className="font-bold text-stone-900">{tArt("ctaTitle")}</h2>
        <p className="text-sm text-stone-700">{tArt("ctaBody")}</p>
        <Link
          href={`/${locale}/products`}
          className="max-w-xs rounded-full bg-amber-700 px-5 py-2.5 text-center font-medium text-white hover:bg-amber-800"
        >
          {t("products")}
        </Link>
      </aside>
    </article>
  );
}