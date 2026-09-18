import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getOrderByRef } from "@/features/orders/queries";
import { getProductById } from "@/features/catalog/queries";
import { signDownload, MAX_DOWNLOADS } from "@/features/orders/download-token";
import { formatMAD } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; ref: string }>;
}) {
  const { locale, ref } = await params;
  const order = await getOrderByRef(ref);
  if (!order) notFound();

  const [t] = await Promise.all([getTranslations("order")]);
  const item = order.items[0];
  const product = item?.productId ? await getProductById(item.productId) : null;
  const retryHref = product
    ? `/${locale}/products/${product.slug}`
    : `/${locale}/products`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{t("orderTitle")}</h1>
        <p className="rounded-full bg-stone-100 px-4 py-1 text-sm font-semibold text-stone-700">
          {t("refLabel")}: {order.ref}
        </p>
      </div>

      {order.status === "paid" ? (
        <div className="flex flex-col gap-4 rounded-xl border border-green-200 bg-green-50 p-6">
          <p className="font-semibold text-green-800">{t("paidBanner")}</p>
          {item ? (
            <div className="flex flex-col gap-2">
              <p className="font-medium text-stone-900">{item.title}</p>
              <p className="font-bold text-amber-800">{formatMAD(item.priceMAD, locale as "ar" | "fr")}</p>
            </div>
          ) : null}
          <a
            href={`/d/${signDownload(order.ref)}`}
            className="inline-flex w-fit rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            {t("downloadButton")}
          </a>
          <p className="text-sm text-stone-600">
            {t("downloadLimit")}{" "}
            <span className="font-semibold">
              {order.downloadCount}/{MAX_DOWNLOADS}
            </span>
          </p>
        </div>
      ) : order.status === "failed" ? (
        <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">{t("statusFailed")}</p>
          <Link
            href={retryHref}
            className="inline-flex w-fit rounded-full bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800"
          >
            {t("tryAgain")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6">
          <p className="font-medium text-stone-700">{t("statusPending")}</p>
          <Link
            href={retryHref}
            className="inline-flex w-fit rounded-full bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800"
          >
            {t("tryAgain")}
          </Link>
        </div>
      )}

      <p className="text-sm text-stone-500">{t("keepRef")}</p>
    </div>
  );
}