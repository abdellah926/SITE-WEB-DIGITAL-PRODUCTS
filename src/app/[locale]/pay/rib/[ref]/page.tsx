import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getOrderByRef } from "@/features/orders/queries";
import { ribConfig, buildRibWhatsappUrl } from "@/features/orders/payment";
import { formatMAD } from "@/lib/format";
import { CopyButton } from "@/components/copy-button";

export const dynamic = "force-dynamic";

export default async function RibPayPage({
  params,
}: {
  params: Promise<{ locale: string; ref: string }>;
}) {
  const { locale, ref } = await params;
  const order = await getOrderByRef(ref);
  if (!order || order.provider !== "rib") notFound();
  if (order.status !== "pending") {
    redirect(`/${locale}/orders/${order.ref}`);
  }

  const [t] = await Promise.all([getTranslations("order")]);
  const item = order.items[0];
  const rib = ribConfig();
  const priceText = formatMAD(order.totalMAD, locale as "ar" | "fr");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-stone-900">{t("ribTitle")}</h1>
        <p className="rounded-full bg-amber-50 px-4 py-1 text-sm font-semibold text-amber-800">
          {t("ribAmount")}: {priceText}
          <span className="mx-2 text-stone-400">·</span>
          {t("refLabel")}: {order.ref}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6">
        <p className="font-semibold text-stone-900">{t("ribStep1Title")}</p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-stone-400">{t("ribIban")}</p>
              <p className="break-all font-mono text-sm font-semibold text-stone-900">{rib.iban}</p>
            </div>
            <CopyButton value={rib.iban} label={t("ribCopy")} copiedLabel={t("ribCopied")} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-stone-400">{t("ribSwift")}</p>
              <p className="font-mono text-sm font-semibold text-stone-900">{rib.swift}</p>
            </div>
            <CopyButton value={rib.swift} label={t("ribCopy")} copiedLabel={t("ribCopied")} />
          </div>
          {rib.holder ? (
            <div className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-xs font-medium text-stone-400">{t("ribHolder")}</p>
              <p className="font-semibold text-stone-900">{rib.holder}</p>
            </div>
          ) : null}
        </div>
        {item ? (
          <p className="text-xs text-stone-500">
            {item.title} — {priceText}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-green-200 bg-green-50 p-6">
        <p className="font-semibold text-green-800">{t("ribStep2Title")}</p>
        <p className="text-sm text-green-700">{t("ribStep2Body")}</p>
        <a
          href={buildRibWhatsappUrl(priceText, order.ref, locale)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
        >
          {t("ribWhatsappButton")}
        </a>
      </div>

      <p className="text-sm text-stone-500">{t("ribNote")}</p>
    </div>
  );
}