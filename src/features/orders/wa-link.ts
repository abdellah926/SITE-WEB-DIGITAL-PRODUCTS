import { log } from "@/lib/log";

const PHONE = process.env.NEXT_PUBLIC_SHOP_PHONE;

export function whatsappHref(
  locale: string,
  product: { title: string; priceMAD: number }
): string | null {
  if (!PHONE) {
    log("warn", "NEXT_PUBLIC_SHOP_PHONE not set — WhatsApp link suppressed");
    return null;
  }
  const digits = PHONE.replace(/\D/g, "");
  const msg =
    locale === "ar"
      ? `\u{627}\u{644}\u{633}\u{644}\u{627}\u{645} \u{639}\u{644}\u{64A}\u{643}\u{645}\uFF0C \u{623}\u{648}\u{62F} \u{637}\u{644}\u{628} \u{201C}${product.title}\u{201D} \u{628}\u{633}\u{639}\u{631} ${product.priceMAD} \u{62F}\u{631}\u{647}\u{645}.`
      : `Bonjour, je souhaite commander \u{201C}${product.title}\u{201D} au prix de ${product.priceMAD} MAD.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}