import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { routing, type Locale } from "@/lib/i18n/routing";

export default async function RootPage() {
  const store = await cookies();
  const pref = (store.get("NEXT_LOCALE")?.value ?? "en") as Locale;
  redirect(`/${routing.locales.includes(pref) ? pref : routing.defaultLocale}`);
}