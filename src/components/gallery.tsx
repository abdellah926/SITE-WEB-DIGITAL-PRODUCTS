import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Product } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/routing";
import { localTitle } from "@/lib/format";
import { WatermarkedImage } from "./watermarked-image";

type Cell = { image: string; slug: string | null; big?: boolean };

const CELLS: Cell[] = [
  { image: "/img/shop/by-cyrus-10.jpg", slug: "crochet-afghan-blanket", big: true },
  { image: "/img/shop/by-cyrus-7.jpg", slug: "amigurumi-doll" },
  { image: "/img/shop/by-cyrus-8.jpg", slug: "handmade-wool-scarf" },
  { image: "/img/shop/by-cyrus-9.jpg", slug: "wool-storage-basket" },
  { image: "/img/shop/by-cyrus-11.jpg", slug: "crochet-beginner-kit" },
  { image: "/img/shop/by-cyrus-12.jpg", slug: "crochet-patterns-bundle" },
];

export async function GalleryMontage({
  locale,
  products,
}: {
  locale: Locale;
  products: Product[];
}) {
  const [t, mt] = await Promise.all([getTranslations("home"), getTranslations("meta")]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-900">{t("galleryTitle")}</h2>
        <Link
          href={`/${locale}/products`}
          className="rounded-full border border-amber-700 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-700 hover:text-white"
        >
          {t("galleryCta")}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 auto-rows-[170px] lg:grid-cols-4">
        {CELLS.map((cell) => {
          const product = cell.slug ? bySlug.get(cell.slug) : null;
          const title = product
            ? localTitle(locale, product.title, product.titleFr ?? "", product.titleEn)
            : t("galleryBadge");
          const href = product
            ? `/${locale}/products/${product.slug}`
            : `/${locale}/products`;
          return (
            <Link
              key={cell.image}
              href={href}
              className={`group relative block h-full overflow-hidden rounded-2xl border border-stone-200 bg-white ${
                cell.big ? "col-span-2 row-span-2" : ""
              }`}
            >
              <WatermarkedImage
                light
                src={cell.image}
                alt={`${title} — ${mt("tagline")}`}
                width={800}
                height={600}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-sm font-medium text-white">
                {title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}