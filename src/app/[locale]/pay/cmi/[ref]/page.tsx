import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getOrderByRef } from "@/features/orders/queries";
import { buildCmiForm } from "@/features/orders/payment";
import { CmiAutoForm } from "@/components/cmi-auto-form";

export const dynamic = "force-dynamic";

export default async function CmiPayPage({
  params,
}: {
  params: Promise<{ locale: string; ref: string }>;
}) {
  const { locale, ref } = await params;
  const order = await getOrderByRef(ref);
  if (!order || order.provider !== "cmi") notFound();
  if (order.status !== "pending") {
    notFound();
  }

  await getTranslations("order");
  const form = buildCmiForm({
    orderRef: order.ref,
    amountMAD: order.totalMAD,
    email: order.email,
    name: order.name,
    locale,
  });

  if (form.mode === "mock") notFound();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-10">
      <CmiAutoForm url={form.url} fields={form.fields} />
    </div>
  );
}