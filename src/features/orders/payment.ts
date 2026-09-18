import { createHmac, timingSafeEqual } from "node:crypto";
import { log } from "@/lib/log";

export type PaymentMode = "cmi" | "mock" | "rib";

export interface RibConfig {
  iban: string;
  swift: string;
  holder: string;
  phone: string;
}

export function ribConfig(): RibConfig {
  return {
    iban: process.env.RIB_IBAN ?? "MA64 2300 1057 6579 1211 0187 0061",
    swift: process.env.RIB_SWIFT ?? "CIHMMAMC",
    holder: process.env.RIB_HOLDER ?? "",
    phone: process.env.NEXT_PUBLIC_SHOP_PHONE ?? "",
  };
}

export function buildRibWhatsappUrl(priceText: string, orderRef: string, locale: string): string {
  const { iban, phone } = ribConfig();
  const digits = String(phone).replace(/\D/g, "").replace(/^0+/, "");
  const msg =
    locale === "ar"
      ? `مرحبا، أؤكد تحويلي البنكي للمنتج (${priceText}) — مرجع الطلب: ${orderRef}. الحساب المستلم: ${iban}.`
      : `Bonjour, je confirme mon virement bancaire (${priceText}) — référence : ${orderRef}. Compte bénéficiaire : ${iban}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

export interface CmiConfig {
  clientId: string;
  storeKey: string;
  baseUrl: string;
  okUrl: string;
  failUrl: string;
  shopUrl: string;
  callbackUrl: string;
}

export interface BuildPaymentInput {
  orderRef: string;
  amountMAD: number;
  email: string;
  name: string;
  locale: string;
}

export interface CmiPaymentForm {
  mode: "cmi";
  url: string;
  fields: Record<string, string>;
}

export type CmiBuildResult = CmiPaymentForm | { mode: "mock" };

export function paymentMode(): PaymentMode {
  const cfg = cmiConfig();
  if (cfg) return "cmi";
  if (process.env.PAYMENT_PROVIDER === "rib") return "rib";
  return "mock";
}

export function cmiConfig(): CmiConfig | null {
  const clientId = process.env.CMI_CLIENT_ID;
  const storeKey = process.env.CMI_STORE_KEY;
  const baseUrl = process.env.CMI_BASE_URI;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const okUrl = process.env.OK_URL ?? `${base}/api/payments/cmi/return`;
  const failUrl = process.env.FAIL_URL ?? `${base}/api/payments/cmi/return`;
  const shopUrl = process.env.SHOP_URL ?? `${base}/ar`;
  const callbackUrl = process.env.CALLBACK_URL ?? `${base}/api/payments/cmi/callback`;
  if (process.env.PAYMENT_PROVIDER !== "cmi") return null;
  if (!clientId || !storeKey || !baseUrl) {
    log("warn", "PAYMENT_PROVIDER=cmi but CMI_CLIENT_ID/CMI_STORE_KEY/CMI_BASE_URI missing — mock fallback");
    return null;
  }
  return { clientId, storeKey, baseUrl, okUrl, failUrl, shopUrl, callbackUrl };
}

export function buildCmiForm(input: BuildPaymentInput): CmiBuildResult {
  const cfg = cmiConfig();
  if (!cfg) return { mode: "mock" };

  const fields: Record<string, string> = {
    clientid: cfg.clientId,
    storetype: "3D_PAY_HOSTING",
    trantype: "PreAuth",
    amount: input.amountMAD.toFixed(2),
    oid: input.orderRef,
    currency: "504",
    lang: input.locale === "ar" ? "ar" : "fr",
    email: input.email,
    BillToName: input.name,
    AutoRedirect: "true",
    okUrl: cfg.okUrl,
    failUrl: cfg.failUrl,
    shopUrl: cfg.shopUrl,
    callbackUrl: cfg.callbackUrl,
  };
  fields.hash = hashPayload(fields, cfg.storeKey);
  return { mode: "cmi", url: cfg.baseUrl, fields };
}

export function verifyCmiReturn(fields: Record<string, string>): boolean {
  const cfg = cmiConfig();
  if (!cfg) return false;
  const received = fields.hash ?? fields.HASH;
  if (!received) return false;
  const rest = { ...fields };
  delete rest.hash;
  delete rest.HASH;
  const expected = hashPayload(rest, cfg.storeKey);
  const a = Buffer.from(String(received));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function returnCode(fields: Record<string, string>): string {
  return fields.ProcReturnCode ?? fields.procreturncode ?? "";
}

function hashPayload(fields: Record<string, string>, storeKey: string): string {
  const entries = Object.keys(fields)
    .filter((k) => k !== "hash" && k !== "HASH")
    .sort();
  const str = entries.map((k) => `${k}=${fields[k]}`).join("|");
  return createHmac("sha512", storeKey).update(str).digest("base64");
}