import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getOrderByRef } from "@/features/orders/queries";

export const dynamic = "force-dynamic";

export default async function MockPayPage({
  params,
}: {
  params: Promise<{ locale: string; ref: string }>;
}) {
  const { locale, ref } = await params;
  const order = await getOrderByRef(ref);
  if (!order || order.provider !== "mock") notFound();
  if (order.status !== "pending") {
    redirect(`/${locale}/orders/${order.ref}`);
  }

  const t = await getTranslations("order");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-4 py-10">
      <div className="flex w-full flex-col gap-4 rounded-xl border border-stone-200 bg-white p-8 text-center">
        <p className="font-medium text-stone-700">{t("mockTitle")}</p>
        <p className="text-sm text-stone-500">{t("mockBody")}</p>
        <p className="text-xs text-stone-400">
          {t("refLabel")}: {order.ref}
        </p>
        <form action="/api/payments/mock" method="post">
          <input type="hidden" name="ref" value={order.ref} />
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="w-full rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            {t("simulatePay")}
          </button>
        </form>
      </div>
    </div>
  );
}