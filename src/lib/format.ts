export function formatMAD(amount: number, locale: string): string {
  const tag = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const MAD_PER_USD = 10;
const MAD_PER_EUR = 11;

export function approxTotal(value: number, locale: string): string {
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-MA", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  if (locale === "en") return `≈ $${nf.format(value / MAD_PER_USD)}`;
  return `≈ ${nf.format(value / MAD_PER_EUR)} €`;
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