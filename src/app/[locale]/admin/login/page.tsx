import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/admin/forms";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("loginTitle")}</h1>
      <LoginForm locale={locale} />
    </div>
  );
}