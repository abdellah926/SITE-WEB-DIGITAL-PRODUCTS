"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

export function CmiAutoForm({
  url,
  fields,
}: {
  url: string;
  fields: Record<string, string>;
}) {
  const t = useTranslations("order");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-stone-200 bg-white p-8 text-center">
      <p className="font-medium text-stone-700">{t("payTitleCmi")}</p>
      <p className="text-sm text-stone-500">{t("payNoteCmi")}</p>
      <form ref={formRef} action={url} method="post" className="contents">
        {Object.entries(fields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <button
          type="submit"
          className="rounded-full bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800"
        >
          {t("payButtonCmi")}
        </button>
      </form>
    </div>
  );
}