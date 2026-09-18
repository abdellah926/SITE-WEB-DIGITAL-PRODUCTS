"use client";

import { usePathname, useRouter } from "next/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";

const LABELS: Record<Locale, string> = {
  ar: "العربية",
  fr: "Français",
  en: "English",
};

function remember(next: Locale) {
  document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
}

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const others = routing.locales.filter((l) => l !== locale);

  function go(next: Locale) {
    const path = pathname.replace(/^\/(ar|fr|en)/, `/${next}`);
    remember(next);
    router.push(path);
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-stone-300 px-1 py-1">
      {others.map((l) => (
        <button
          key={l}
          onClick={() => go(l)}
          className="rounded px-2 py-0.5 text-sm text-stone-600 hover:bg-amber-50 hover:text-amber-800"
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}