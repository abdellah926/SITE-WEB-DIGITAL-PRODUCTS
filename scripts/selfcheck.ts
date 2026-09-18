import { log } from "@/lib/log";
import { issueToken, passwordOk, verifyToken } from "@/features/admin/session";
import { whatsappHref } from "@/features/orders/wa-link";
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

/* orders: wa link */
const phone = process.env.NEXT_PUBLIC_SHOP_PHONE;
const expectedDigits = phone ? phone.replace(/\D/g, "") : "";
const waAr = whatsappHref("ar", { title: "بطانية", priceMAD: 350 });
check("orders: wa link present when phone configured", phone ? waAr !== null : waAr === null);
if (waAr) {
  check("orders: wa.me host", waAr.startsWith(`https://wa.me/${expectedDigits}?text=`));
  check("orders: message url-encoded", waAr.includes("text=%"));
}

/* format: slugify */
check("format: slugify ascii", slugify("Hello World!") === "hello-world");
check("format: slugify strips arabic", /^[a-z0-9-]*$/.test(slugify("الكرشي البداية")));
check("format: slugify trims lengths", slugify("a".repeat(200)).length <= 120);

for (const r of results) log("info", r);
console.log(results.join("\n"));
console.log("TOKEN=" + (process.env.ADMIN_SECRET ? token : ""));
process.exit(process.exitCode ?? 0);