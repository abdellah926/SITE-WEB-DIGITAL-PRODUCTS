import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import "../globals.css";
import { routing } from "@/lib/i18n/routing";
import { SiteHeader, SiteFooter } from "@/components/layout";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className="h-full">
      <body className="flex min-h-dvh flex-col bg-stone-50 text-stone-900">
        <NextIntlClientProvider messages={messages}>
          <SiteHeader locale={locale as "ar" | "fr"} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale as "ar" | "fr"} />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}