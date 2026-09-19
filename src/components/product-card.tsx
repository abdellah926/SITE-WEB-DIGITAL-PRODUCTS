import Link from "next/link";
import { localTitle } from "@/lib/format";
import type { Product } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/routing";
import { WatermarkedImage } from "./watermarked-image";
import { PriceBlock } from "./price";

export function ProductCard({ locale, product }: { locale: Locale; product: Product }) {
  const title = localTitle(locale, product.title, product.titleFr, product.titleEn);
  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md"
    >
      <WatermarkedImage
        src={product.images[0] ?? "/img/crochet-blanket.svg"}
        alt={title}
        width={600}
        height={450}
        className="h-44 w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium text-stone-900 group-hover:text-amber-800">{title}</h3>
        <PriceBlock product={product} locale={locale} />
      </div>
    </Link>
  );
}