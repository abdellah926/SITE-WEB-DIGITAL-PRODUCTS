import Link from "next/link";
import { localTitle } from "@/lib/format";
import type { Product } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/routing";
import { ProductImages } from "./product-images";
import { PriceBlock } from "./price";

export function ProductCard({ locale, product }: { locale: Locale; product: Product }) {
  // These cards were consolidated into the guide and scarf galleries.
  if (["amigurumi-doll", "wool-storage-basket"].includes(product.slug)) return null;
  const title = localTitle(locale, product.title, product.titleFr, product.titleEn);
  return (
    <article
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md"
    >
      <ProductImages images={product.images} title={title} href={`/${locale}/products/${product.slug}`} compact />
      <Link href={`/${locale}/products/${product.slug}`} className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium text-stone-900 group-hover:text-amber-800">{title}</h3>
        <PriceBlock product={product} locale={locale} />
      </Link>
    </article>
  );
}
