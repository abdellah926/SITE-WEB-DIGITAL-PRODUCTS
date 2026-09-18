import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitch } from "./locale-switch";

export async function SiteHeader({ locale }: { locale: "ar" | "fr" }) {
  const t = await getTranslations("nav");
  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/products`, label: t("products") },
    { href: `/${locale}/articles`, label: t("articles") },
    { href: `/${locale}/admin`, label: t("admin") },
  ];
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${locale}`} className="text-lg font-bold text-amber-800">
          Crochet&Handmade
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-stone-700 hover:text-amber-800">
              {l.label}
            </Link>
          ))}
          <LocaleSwitch locale={locale} />
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter({}: { locale: "ar" | "fr" }) {
  const t = await getTranslations("footer");
  return (
    <footer className="border-t border-stone-200 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-stone-500">
        <p>
          © {new Date().getFullYear()} Crochet&Handmade — {t("rights")}
        </p>
      </div>
    </footer>
  );
}