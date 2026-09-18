export function formatMAD(amount: number, locale: string): string {
  const tag = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function localTitle(locale: string, ar: string, fr: string): string {
  return locale === "ar" ? ar : fr;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0640-\u06FF]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}