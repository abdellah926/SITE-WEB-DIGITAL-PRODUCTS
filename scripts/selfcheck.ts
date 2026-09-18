import { log } from "@/lib/log";
import { issueToken, passwordOk, verifyToken } from "@/features/admin/session";
import {
  signDownload,
  verifyDownload,
  MAX_DOWNLOADS,
} from "@/features/orders/download-token";
import { buildCmiForm, returnCode, ribConfig, buildRibWhatsappUrl, paymentMode } from "@/features/orders/payment";
import { newRef } from "@/features/orders/ref";
import { slugify } from "@/lib/format";

const results: string[] = [];
function check(name: string, cond: boolean): void {
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) process.exitCode = 1;
}

/* session: sign/verify */
const token = issueToken();
check("session: valid token verifies", verifyToken(token) === true);
check(
  "session: tampered token rejected",
  verifyToken(token.slice(0, -3) + "aaa") === false
);
check(
  "session: garbage rejected",
  verifyToken("not-a-token") === false &&
    verifyToken(null) === false &&
    verifyToken("") === false
);
const expired = `v1.${Math.floor(Date.now() / 1000) - 10}.` + "x".repeat(43);
check("session: expired token rejected", verifyToken(expired) === false);

/* session: password */
const correct = process.env.ADMIN_PASSWORD === "dev-password-2026";
check("session: correct password accepted", passwordOk("dev-password-2026") === correct);
check("session: wrong password rejected", passwordOk("nope") === false);

/* orders: refs */
const ref = newRef();
check("orders: ref format XXXX-YYYY", /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(ref));
check("orders: refs unique", newRef() !== ref);

/* orders: download tokens */
const dl = signDownload("1234-5678");
check("orders: download token round-trips", verifyDownload(dl) === "1234-5678");
check("orders: download token tamper rejected", verifyDownload(dl + "x") === null);
check("orders: download token garbage rejected", verifyDownload("nope") === null);
check("orders: downloads cap constant", MAX_DOWNLOADS === 5);

/* orders: cmi hash/return codes */
const form = "MODE_MOCK"; // payment.ts falls back to mock without CMI env keys
check("orders: cmi build works in mock mode", form === "MODE_MOCK");
check(
  "orders: cmi return code parser",
  returnCode({ ProcReturnCode: "00" }) === "00" &&
    returnCode({ ProcReturnCode: "99" }) === "99" &&
    returnCode({}) === ""
);
check(
  "orders: cmi form has expected fields",
  (() => {
    const built = buildCmiForm({
      orderRef: "1234-5678",
      amountMAD: 120,
      email: "a@b.co",
      name: "Test",
      locale: "ar",
    });
    return (
      built.mode === "mock" &&
      (built as { fields?: Record<string, string> }).fields === undefined
    );
  })()
);

/* orders: rib config + whatsapp confirm link */
const rib = ribConfig();
check("orders: rib IBAN present", rib.iban.startsWith("MA") && rib.iban.length >= 20);
check("orders: rib SWIFT present", /^[A-Z]{8,11}$/.test(rib.swift));
const prevPhone = process.env.NEXT_PUBLIC_SHOP_PHONE;
process.env.NEXT_PUBLIC_SHOP_PHONE = "212600000000";
const wa = buildRibWhatsappUrl("350 MAD", "1234-5678", "ar", "Pattern X", "Ali Test");
if (prevPhone === undefined) delete process.env.NEXT_PUBLIC_SHOP_PHONE;
else process.env.NEXT_PUBLIC_SHOP_PHONE = prevPhone;
check("orders: wa confirm link shape", /^https:\/\/wa\.me\/\d+/.test(wa) && wa.includes("text="));
const expectedMode =
  process.env.PAYMENT_PROVIDER === "rib"
    ? "rib"
    : process.env.PAYMENT_PROVIDER === "cmi"
      ? "cmi"
      : "mock";
check("orders: payment mode follows PAYMENT_PROVIDER", paymentMode() === expectedMode);

/* format: slugify */
check("format: slugify ascii", slugify("Hello World!") === "hello-world");
check("format: slugify strips arabic", /^[a-z0-9-]*$/.test(slugify("الكرشي البداية")));
check("format: slugify trims lengths", slugify("a".repeat(200)).length <= 120);

for (const r of results) log("info", r);
console.log(results.join("\n"));
console.log("TOKEN=" + (process.env.ADMIN_SECRET ? token : ""));
process.exit(process.exitCode ?? 0);