"use client";

import { usePathname, useRouter } from "next/navigation";

export function LocaleSwitch({ locale }: { locale: "ar" | "fr" }) {
  const pathname = usePathname();
  const router = useRouter();
  const other = locale === "ar" ? "fr" : "ar";
  const label = other === "ar" ? "العربية" : "Français";

  function go() {
    const next = pathname.replace(/^\/(ar|fr)/, `/${other}`);
    document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000; samesite=lax`;
    router.push(next);
  }

  return (
    <button
      onClick={go}
      className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:border-amber-700 hover:text-amber-800"
    >
      {label}
    </button>
  );
}