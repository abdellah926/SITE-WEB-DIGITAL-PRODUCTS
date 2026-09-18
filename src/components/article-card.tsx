import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Article } from "@/lib/db/schema";

export async function ArticleCard({ locale, article }: { locale: "ar" | "fr"; article: Article }) {
  const t = await getTranslations("article");
  return (
    <Link
      href={`/${locale}/articles/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md"
    >
      <Image
        src={article.image ?? "/img/article-default.svg"}
        alt={article.title}
        width={600}
        height={400}
        unoptimized
        className="h-40 w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-medium text-stone-900 group-hover:text-amber-800">{article.title}</h3>
        <p className="line-clamp-2 text-sm text-stone-600">{article.excerpt}</p>
        <span className="mt-auto text-sm font-medium text-amber-800">{t("readMore")} ←</span>
      </div>
    </Link>
  );
}