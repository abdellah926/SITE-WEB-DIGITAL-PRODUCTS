import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { listOrders } from "@/features/orders/queries";
import { requireAdmin } from "@/features/admin/session";
import { formatMAD } from "@/lib/format";
import { markOrderPaidAction } from "@/features/admin/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

function statusBadge(status: string) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold";
  if (status === "paid") return `${base} bg-green-100 text-green-800`;
  if (status === "failed") return `${base} bg-red-100 text-red-700`;
  return `${base} bg-amber-100 text-amber-800`;
}

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const [t, orders] = await Promise.all([getTranslations("admin"), listOrders()]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("totalOrders")}</h1>
      {orders.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-500">
          {t("ordersNone")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t("refLabel")}</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">↓</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {o.ref}
                    {o.items[0] ? (
                      <div className="text-xs font-normal text-stone-400">
                        {o.items[0].title}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{o.name}</td>
                  <td className="px-4 py-3 text-stone-500">{o.email}</td>
                  <td className="px-4 py-3 font-semibold text-amber-800">
                    {formatMAD(o.totalMAD, locale as "ar" | "fr")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(o.status)}>{o.status}</span>
                    {o.provider ? <span className="ml-1 text-xs text-stone-400">{o.provider}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {o.downloadCount}
                    {o.paidAt ? (
                      <div className="text-xs text-stone-400">
                        {new Date(o.paidAt).toISOString().slice(0, 10)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {o.status === "pending" ? (
                      <form action={markOrderPaidAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <button
                          type="submit"
                          className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          {t("markPaid")}
                        </button>
                      </form>
                    ) : (
                      <a
                        href={`/${locale}/orders/${o.ref}`}
                        className="rounded-full border border-stone-300 px-4 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
                      >
                        {t("open")}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}