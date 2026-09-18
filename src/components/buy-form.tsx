"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n/routing";
import { buyProduct } from "@/features/orders/actions";

export function BuyForm({
  locale,
  slug,
  priceText,
}: {
  locale: Locale;
  slug: string;
  priceText: string;
}) {
  const t = useTranslations("order");
  const [state, action, pending] = useActionState(buyProduct, {});

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-5"
    >
      <p className="text-sm font-semibold text-stone-900">{priceText}</p>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <label className="flex flex-col gap-1 text-sm text-stone-700">
        {t("nameLabel")}
        <input
          name="name"
          required
          minLength={2}
          maxLength={120}
          className="rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-stone-700">
        {t("emailLabel")}
        <input
          type="email"
          name="email"
          required
          maxLength={200}
          className="rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
        />
        <span className="text-xs text-stone-400">{t("emailHint")}</span>
      </label>
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{t(state.error)}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {pending ? "…" : t("payNow")}
      </button>
    </form>
  );
}