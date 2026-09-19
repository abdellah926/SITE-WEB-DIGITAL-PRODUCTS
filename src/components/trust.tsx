import { getTranslations } from "next-intl/server";

const ITEMS = ["trustSecure", "trustInstant", "trustPdf", "trustNoShip"] as const;
const ICONS = ["🔒", "⚡", "📄", "❌"];

export async function TrustBlock() {
  const t = await getTranslations("product");
  return (
    <ul className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
      {ITEMS.map((key, i) => (
        <li key={key} className="flex items-center gap-2">
          <span aria-hidden="true">{ICONS[i]}</span> {t(key)}
        </li>
      ))}
    </ul>
  );
}