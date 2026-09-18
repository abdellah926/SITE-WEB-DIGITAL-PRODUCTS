import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_DOWNLOADS = 5;
const TTL_SECONDS = 7 * 24 * 60 * 60;

function secret(): string {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) throw new Error("ADMIN_SECRET must be set (min 16 chars)");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function signDownload(orderRef: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `dl1.${orderRef}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyDownload(token: string | null | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [v, orderRef, exp, sig] = parts;
  if (v !== "dl1" || !orderRef || !exp || !sig) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(sign(`dl1.${orderRef}.${exp}`));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return orderRef;
  } catch {
    return null;
  }
}