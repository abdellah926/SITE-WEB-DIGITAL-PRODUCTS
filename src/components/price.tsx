import type { Product } from "@/lib/db/schema";
import { approxTotal, formatMAD, formatUsd } from "@/lib/format";

export function PriceBlock({
  product,
  locale,
  big = false,
}: {
  product: Product;
  locale: string;
  big?: boolean;
}) {
  const base = `font-bold text-amber-800 ${big ? "text-2xl" : "text-sm"}`;
  const hint = `font-normal text-stone-500 ${big ? "text-sm" : "text-xs"}`;
  if (product.priceUSD > 0) {
    return (
      <p className={base}>
        {formatUsd(product.priceUSD, locale)}{" "}
        <span className={hint}>≈ {formatMAD(product.priceMAD, locale)}</span>
      </p>
    );
  }
  return (
    <p className={base}>
      {formatMAD(product.priceMAD, locale)}{" "}
      <span className={hint}>{approxTotal(product.priceMAD, locale)}</span>
    </p>
  );
}