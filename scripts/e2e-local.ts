import { createOrder, getOrderByRef } from "@/features/orders/queries";
import { signDownload, verifyDownload } from "@/features/orders/download-token";
import { getProductBySlug } from "@/features/catalog/queries";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const results: string[] = [];
function check(name: string, cond: boolean): void {
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const product = await getProductBySlug("crochet-afghan-blanket");
  if (!product) {
    console.log("FAIL  e2e: product not found");
    process.exit(1);
  }
  const order = await createOrder({
    name: "Test Buyer E2E",
    email: "e2e@test.co",
    locale: "ar",
    totalMAD: product.priceMAD,
    provider: "mock",
    item: {
      productId: product.id,
      title: product.title,
      priceMAD: product.priceMAD,
      fileKey: product.fileKey as string,
    },
  });
  if (!order) {
    console.log("FAIL  e2e: createOrder returned null (DB down?)");
    process.exit(1);
  }
  console.log("created order ref=" + order.ref);

  // rib (virement) flow: dedicated page renders the RIB once, with WhatsApp confirm CTA
  const ribOrder = await createOrder({
    name: "Test Buyer RIB",
    email: "rib@test.co",
    locale: "en",
    totalMAD: product.priceMAD,
    provider: "rib",
    item: {
      productId: product.id,
      title: product.title,
      priceMAD: product.priceMAD,
      fileKey: product.fileKey as string,
    },
  });
  if (!ribOrder) {
    console.log("FAIL  e2e: rib createOrder returned null (DB down?)");
    process.exit(1);
  }
  const ribPage = await fetch(`${BASE}/en/pay/rib/${ribOrder.ref}`);
  const ribHtml = await ribPage.text();
  check("e2e: rib pay page 200", ribPage.status === 200);
  check("e2e: rib page shows IBAN", ribHtml.includes("MA64 2300 1057 6579 1211 0187 0061"));
  check("e2e: rib page shows RIB", ribHtml.includes("230 010 5765791211018700 61"));
  check("e2e: rib page shows product title", ribHtml.includes(product.titleFr || product.title));
  check("e2e: rib page shows registered buyer name", ribHtml.includes("Test Buyer RIB"));
  check("e2e: rib page english heading", ribHtml.includes("Bank transfer payment"));
  check("e2e: rib page has wa.me confirm link", ribHtml.includes("wa.me/"));
  check("e2e: rib page noindex", ribHtml.toLowerCase().includes("noindex"));
  const robotsRes = await fetch(`${BASE}/robots.txt`);
  const robotsText = await robotsRes.text();
  check("e2e: robots disallows /pay", robotsText.includes("/pay/"));

  // english storefront renders
  const enHome = await fetch(`${BASE}/en`);
  check("e2e: english home 200", enHome.status === 200);
  const enProd = await fetch(`${BASE}/en/products`);
  await enProd.text();
  check("e2e: english products 200", enProd.status === 200);
  check("e2e: english buy label", (await (await fetch(`${BASE}/en/products/crochet-afghan-blanket`)).text()).includes("Buy now"));

  // storefront copy is country-free (global storefront)
  const arHome = await (await fetch(`${BASE}/ar`)).text();
  const frHome = await (await fetch(`${BASE}/fr`)).text();
  const enHomeText = await enHome.text();
  const frScarf = await (await fetch(`${BASE}/fr/products/handmade-wool-scarf`)).text();
  check("e2e: ar home free of country mention", !arHome.includes("المغرب") && !arHome.includes("مغربية"));
  check("e2e: fr home free of country mention", !frHome.toLowerCase().includes("maroc"));
  check("e2e: en home free of country mention", !enHomeText.toLowerCase().includes("morocc"));
  check("e2e: fr scarf product free of country mention", !frScarf.toLowerCase().includes("marocain"));
  check("e2e: prices show approx usd/eur", frHome.includes("≈ ") || enHomeText.includes("≈ $"));
  const enBlanket = await (await fetch(`${BASE}/en/products/crochet-afghan-blanket`)).text();
  check("e2e: price approx is 5 usd", enBlanket.includes("≈ $5"));
  const rootEn = await fetch(`${BASE}/`, { headers: { Cookie: "NEXT_LOCALE=en" } });
  check("e2e: root follows cookie to english", rootEn.url.replace(/\/?$/, "").endsWith("/en"));
  const arMidEn = await fetch(`${BASE}/ar/products`, { headers: { Cookie: "NEXT_LOCALE=en" } });
  check("e2e: ar page follows cookie to english", arMidEn.url.replace(/\/?$/, "").endsWith("/en/products"));

  // order starts pending
  let o = await getOrderByRef(order.ref);
  check("e2e: order created pending", o?.status === "pending");

  // pay mock page renders simulate button (order still pending)
  const payPage = await fetch(`${BASE}/ar/pay/mock/${order.ref}`);
  const payHtml = await payPage.text();
  check("e2e: mock pay page 200", payPage.status === 200);
  check("e2e: mock simulate form", payHtml.includes("/api/payments/mock"));

  // simulate payment via the mock API route
  const form = new URLSearchParams({ ref: order.ref, locale: "ar", paid: "1" });
  const payRes = await fetch(`${BASE}/api/payments/mock`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  check("e2e: mock pay redirects 303", payRes.status === 303);
  const loc = payRes.headers.get("location") ?? "";
  check("e2e: redirect to orders page", loc.includes(`/ar/orders/${order.ref}`));

  // order now paid
  o = await getOrderByRef(order.ref);
  check("e2e: order became paid", o?.status === "paid");

  // download token round-trips
  const token = signDownload(order.ref);
  check("e2e: download token verifies", verifyDownload(token) === order.ref);

  // download: pre-paid (provider mock) route
  const dlRes = await fetch(`${BASE}/d/${token}`);
  check("e2e: download returns 200 PDF", dlRes.status === 200);
  const buf = new Uint8Array(await dlRes.arrayBuffer());
  const head = Buffer.from(buf.slice(0, 5)).toString("ascii");
  check("e2e: download is a PDF (magic)", head === "%PDF-");
  check("e2e: PDF grew (watermark added)", buf.length > 30000);

  // no-store + noindex headers
  check("e2e: Cache-Control private no-store", (dlRes.headers.get("cache-control") ?? "").includes("no-store"));
  check("e2e: X-Robots-Tag noindex", (dlRes.headers.get("x-robots-tag") ?? "").includes("noindex"));

  // attempt additional downloads up to the cap
  for (let i = 2; i <= 6; i++) {
    const res = await fetch(`${BASE}/d/${token}`);
    check(`e2e: download #${i} ${i <= 5 ? "ok" : "blocked"}`, i <= 5 ? res.status === 200 : res.status === 403);
  }

  // unauthenticated/expired token rejected
  check("e2e: tampered token rejected", (await fetch(`${BASE}/d/${token}x`)).status === 404);
  check("e2e: garbage token rejected", (await fetch(`${BASE}/d/whatever`)).status === 404);

  // order page shows paid + download link
  const orderPage = await fetch(`${BASE}/ar/orders/${order.ref}?paid=1`);
  const html = await orderPage.text();
  check("e2e: order page 200", orderPage.status === 200);
  check("e2e: order page has download button", html.includes(`/d/`));
  check("e2e: order page noindex", html.toLowerCase().includes("noindex"));

  // product page no longer has whatsapp, has buy button
  const prod = await fetch(`${BASE}/ar/products/crochet-afghan-blanket`);
  const ph = await prod.text();
  check("e2e: product page 200", prod.status === 200);
  check("e2e: no wa.me on product page", !ph.includes("wa.me"));
  check("e2e: buy link on product page", ph.includes(`/ar/products/crochet-afghan-blanket/buy`));
  check("e2e: buy button label", ph.includes("شراء الآن"));

  // admin noindex
  const adm = await fetch(`${BASE}/ar/admin/login`);
  const adh = await adm.text();
  check("e2e: admin login noindex", adh.toLowerCase().includes("noindex"));

  console.log(results.join("\n"));
  process.exit(process.exitCode ?? 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});