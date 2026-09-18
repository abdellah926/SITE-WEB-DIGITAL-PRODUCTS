import Link from "next/link";
import Image from "next/image";
import { formatMAD } from "@/lib/format";
import type { Product } from "@/lib/db/schema";

export function ProductCard({ locale, product }: { locale: "ar" | "fr"; product: Product }) {
  const title = locale === "fr" ? product.titleFr : product.title;
  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md"
    >
      <Image
        src={product.images[0] ?? "/img/crochet-blanket.svg"}
        alt={title}
        width={600}
        height={450}
        unoptimized
        className="h-44 w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium text-stone-900 group-hover:text-amber-800">{title}</h3>
        <p className="text-sm font-bold text-amber-800">
          {formatMAD(product.priceMAD, locale)}
        </p>
      </div>
    </Link>
  );
}