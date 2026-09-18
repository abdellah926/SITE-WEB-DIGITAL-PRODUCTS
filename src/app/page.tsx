import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootPage() {
  const store = await cookies();
  const pref = store.get("NEXT_LOCALE")?.value === "fr" ? "fr" : "ar";
  redirect(`/${pref}`);
}