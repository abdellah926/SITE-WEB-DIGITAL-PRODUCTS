# PROJECT_MAP — Handmade / Crochet Storefront (Morocco)

> Status: IN PROGRESS — M0–M2 done end-to-end, M3/M4 done with live-DB verification, M5 pending deployment. Snapshot date: **2026-09-18** (Node v26.1.0).
> Business: trusted brand + sales + article/tutorial traffic for the Moroccan handicraft & crochet niche.
> No guaranteed-profit or guaranteed-admission promises are made to users.

---

## [TECH_STACK]

Decisions locked: **Next.js 16 monolith**, **WhatsApp/COD order flow (no payment gateway in v1)**, **minimal in-app admin (single credential)**. Simplicity-first; every feature maps to a verifiable goal.

### Pinned production deps (stable, non-deprecated, verified via npm registry today)

| Package | Version | Role |
|---|---|---|
| next | 16.3.5 | App Router, RSC, Server Actions, SSR/SEO (no middleware/proxy — avoided by design) |
| react / react-dom | 19.2.8 | UI runtime (peer of next@16) |
| typescript | 5.9.3 | Strict mode (TS 7.0 rejected: `typescript-eslint` unsupported) |
| eslint | 9.39.5 | Lint (ESLint 10 rejected: breaks `eslint-plugin-react` inside `eslint-config-next`) |
| tailwindcss | 4.3.3 | CSS-first config (v4; no `tailwind.config.*`) |
| lucide-react | 1.47.0 | Icon set (whitelisted icons only) |
| next-intl | 4.14.5 | i18n: `ar` (RTL) + `fr`, locale routing |
| drizzle-orm | 0.45.2 | Typed SQL layer (single schema) |
| drizzle-kit | 0.31.10 | Migrations + seed codegen (dev-only) |
| zod | 4.6.5 | Server-side form/input validation |
| @vercel/analytics | 2.0.1 | Traffic/Web-Vitals telemetry (required: grow article traffic) |

### Platform / infra
- **Database**: PostgreSQL (same dialect in dev & prod → Neon free tier). SQLite rejected to keep one dialect, one schema.
- **Runtime**: Node.js >= 26 (LTS), pinned via `engines` (local is v26.1.0).
- **Deploy**: Vercel (single workspace, no monorepo, no extra services).

### Intentionally REJECTED (no feature creep / deprecated)
- `next-auth@4.x` — legacy line; admin auth = env credential + HMAC-signed HTTP-only cookie (zero-dep, single operator).
- Payment gateway (CMI/etc.) — deferred to Phase 2; v1 orders complete over WhatsApp (COD norms in MA).
- External headless CMS, Redis, cache layer, MDX pipeline, multi-role RBAC, user accounts, newsletter, reviews, stock/variant tracking, media-upload service. Each re-evaluated only when a milestone demands it.

---

## [SYSTEM_FLOW]

### Data / order flow (API-less by design)
```
[Public visitor]
  1. enter site (ar|fr) ─► 2. browse catalog by category ─► 3. open product (price_MAD, in_stock)
       ─► 4. tap "Order via WhatsApp" → wa.me/{SHOP_PHONE}?text=encoded(product+price)
       ─► 5. conversation continues in WhatsApp; sale closes out-of-band (COD)

[Content flow]
  article listing ─► article detail ─► inline CTA block (related featured product) ─► catalog

[Admin operator]
  /admin ─► env-credential login ─► HMAC cookie ─► CRUD products|categories|articles ─► Postgres
       ─► `revalidatePath` → public pages reflect immediately
```

### Verifiable user-journey goals (acceptance anchors)
- **G1**: Landing shows featured products + latest articles for locale `ar` (RTL) and `fr`.
- **G2**: Catalog filters by category; product page renders MAD price, stock state, and WhatsApp CTA.
- **G3**: WhatsApp CTA produces a valid `wa.me` URL whose text carries product name + price (assertable).
- **G4**: `/admin*` returns 401/redirect without admin cookie; logged-in CRUD persists to Postgres and is reflected publicly.
- **G5**: `/sitemap.xml`, `/robots.txt`, per-route meta/OG tags present. Lighthouse SEO >= 90 on article page.
- **G6**: Async error handling: unknown routes → custom 404; routed errors → custom 500; no stack trace leaks.

---

## [ARCHITECTURE]

### Principles applied
- **Surgical**: smallest code that satisfies G1–G6. No generic abstractions for single-use logic.
- **Domain-Driven vertical slices**, **no micro-files**: components/queries co-locate per feature.
- **Shared/Core only where truly repeated**: DB client + schema, i18n config, `cn()`, logger (< 4 modules).
- **No separate REST layer**: writes go through Server Actions; reads are RSC queries. Only edge cases add a route handler.

### Planned layout (single package at repo root)
```
src/
  app/
    [locale]/                         # next-intl locale group
      page.tsx                        # G1 landing (hero + featured + latest articles)
      products/page.tsx               # G2 catalog (searchParams validated w/ zod)
      products/[slug]/page.tsx        # G2 product + WhatsApp CTA (G3)
      articles/page.tsx
      articles/[slug]/page.tsx        # content + product CTA block
      admin/page.tsx                  # dashboard (guarded)
      admin/products/... admin/categories/... admin/articles/...  # CRUD pages (guarded)
    sitemap.ts  robots.ts  not-found.tsx  global-error.tsx        # G5-G6
  ```
- **Layout rule (verified vs next-intl v4 without middleware/proxy)**: `<html>` lives in `app/[locale]/layout.tsx` (calls `setRequestLocale` + `generateStaticParams`), NOT in a root `app/layout.tsx` — `getLocale()` resolves per-request only after `setRequestLocale`. `app/page.tsx` is a cookie-based redirect to `/[locale]`; root `not-found.tsx` is a self-contained full document (no root layout wraps it).
- **CSS rule (Next 16.3.5 + Turbopack gotcha, fixed)**: the Tailwind entry (`globals.css`) MUST be imported from the thin root `app/layout.tsx` (`./globals.css`, returns `children` without html), NOT from `[locale]/layout.tsx`. Importing it from a *dynamic* segment layout causes the `<link rel="stylesheet">` to be emitted ONLY for statically-prerendered routes (e.g. admin/login) — all `ƒ` dynamic routes then ship zero CSS → classic "HTML without design". Verified with production build, `next start`, and headless-browser DOM (link present + CSS 200 + `.bg-stone-50` rule served).
  features/
    catalog/    schema.ts co-located queries, card/detail components
    content/    article entity, renderer (plain content, no MDX), CTA block
    orders/     wa-link builder + order-intent types in shared place
    admin/      env-auth, HMAC cookie, guard middleware, CRUD server actions + forms
  lib/
    db/         client.ts, schema.ts (single source), seed.ts
    i18n/       routing.ts, request.ts (next-intl)
    log.ts      async logger (Protocol 4)
```
File-count guard: each feature targets 4–7 files max; merge before splitting.

### Data model (single Drizzle schema, canonical tables — v1 decisions)
- `products(id, slug UNIQUE, title, titleFr, description, descriptionFr, priceMAD INTEGER, images TEXT[], category_id FK, in_stock BOOL, featured BOOL, created_at, updated_at)`
- `categories(id, slug UNIQUE, name, nameFr, sort)`
- `articles(id, slug UNIQUE, title, excerpt, body TEXT, image, locale, published_at)` — `article.productId` dropped (speculative dead FK frozen in 0000; revisit only if a milestone needs it)
- No sessions/users tables (admin creds live in env only). Prices stored as integer dirhams directly (`priceMAD`, no cents — MAD has no minor unit). Formatting util lives in `lib/format.ts`.

---

## [LOGGING — Async, non-blocking, minimal]

- Levels: `info | warn | error` only. No debug spam, no log frameworks.
- `lib/log.ts` API: `log.info(msg, meta?)`, `log.warn(...)`, `log.error(err, context)`. JSON-serialized.
- Non-blocking strategy: messages enqueue on an in-memory bounded queue (`setImmediate` drain → `console`/provider adapter). The request path never awaits the write; failures are swallowed with a counter, never crash.
- **Safe logging**: redact `SHOP_PHONE`, auth secrets, env values; never log request bodies or full errors beyond `message`+`cause` at error level. Client-side: no custom logging (use @vercel/analytics only).
- Provider seam: single `LogSink` interface so Vercel log drain can be swapped (e.g. Axiom/Custom) without touching call sites.

---

## [ORPHANS & PENDING]

- **RESOLVED**: live PostgreSQL (Neon, pooler endpoint) configured in `.env.local`; `drizzle-kit migrate` applied the v1 schema; `seed.ts` loaded 5 products / 3 categories / 6 articles.
- **RESOLVED (operator input)**: real product photos — the 6 "BY CYRUS/CYRUS" photos (source `%USERPROFILE%\Downloads`) resized to web JPEG (≤343KB, max 1400px, white-flattened) via `scripts/resize-photos.ps1` → `public/img/shop/by-cyrus-1..6.jpg`; attached to seeded products in order (by-cyrus-1..5, seed order: afghan blanket, amigurumi, scarf, basket, kit) and served 200 on dev. Old SVG placeholders remain only as ProductCard/detail fallbacks.
- **RESOLVED (feature)**: homepage gallery montage — `src/components/gallery.tsx` bento grid (6 cells; img №1 = large 2×2; imgs 1–4 = "perfect 4" prominent; №6 = "Bientôt disponible/جديد قريباً" → /products); every cell links to its product page; keyword-rich `alt` = product title + tagline. Verified live dev: /ar & /fr contain gallery title/badge/CTA + 6 images; detail page shows by-cyrus image.
- **RESOLVED (deploy)**: `vercel login` on this machine (abdellah926), project linked `crochette/site-web-digital-products` (`.vercel/` gitignored). The 5 env vars set on the Vercel dashboard ~1h earlier were WRONG (DATABASE_URL pointed to an EMPTY Neon DB ⇒ empty catalog + product 500/404; NEXT_PUBLIC_SITE_URL missing ⇒ relative sitemap locs) → removed & re-added via CLI to canonical values, then fresh `vercel --prod` deploy. **LIVE VERIFIED (2026-09-18, alias site-web-digital-products.vercel.app)**: homepage montage renders (6 by-cyrus imgs, "أحدث إبداعاتنا" + badge), product detail 200 (`بطانية كروشي صوفية` 350 د.م, by-cyrus-1.jpg, wa.me×2), sitemap absolute (`https://site-web-digital-products.vercel.app/...`), images 200. ProductCard intentionally has no WA button (cards link to detail page).
- **RESOLVED (SEO)**: `meta.keywords` + `meta.description` (ar+fr) baked into root layout + `generateMetadata` on home & products index (explicit `getTranslations({locale, namespace})` in metadata — better per next-intl guidance); ar keywords: كروشي، أعمال يدوية، هدايا، بطانية كروشي، دمية أميغورومي، وشاح صوف، تعلم الكروشي، اشتري أونلاين المغرب، دفع عند الاستلام، صناعة يدوية مغربية (fr mirrored). Verified meta tags in head of /ar + /fr dev HTML.
- **PENDING (operator input)**: real WhatsApp Business number (currently placeholder `NEXT_PUBLIC_SHOP_PHONE=212600000000`) + final pre-filled message templates ar/fr.
- **PENDING**: MAP keyword strategy for SEO (crochet terms ar/fr) — inputs for M3/G5 refinement.
- **PENDING (production security)**: rotate/replace the Neon credentials after first live deploy — they were shared in chat and live in `.env.local` only (gitignored, never committed; `.env.local`/`.env` confirmed via `git check-ignore`).
- **PENDING (i18n wording)**: footer/nav admin label currently reads "الإدارة" — consider "لوحة الإدارة"; ar nav typo "مقولات ودروس"→"مقالات ودروس" fixed in messages.
- **RESOLVED (UI/UX)**: unstyled "HTML-only" rendering fixed (see CSS rule above) — pending deploy to Vercel.
- **PENDING (Phase 2)**: CMI/payment gateway, cart, inventory/variants, order DB, media pipeline, newsletter.
- **ORPHAN resolved**: currency formatting (`formatMAD`, `lib/format.ts`); seed dataset for 5 products + 6 articles produced as seed.ts + SVG placeholders.
- **Decisions recorded**: TS pinned to 5.9.3 and eslint to 9.39.5 (toolchain compat); `next lint` replaced by `eslint` directly; npm audit shows 4 moderate dev-only vulns inside drizzle-kit toolchain (no safe fix without breaking downgrade — accepted). CSS rule (import `globals.css` from thin root `src/app/layout.tsx`, NOT dynamic-segment layout — Next 16.3.5+Turbopack otherwise emits stylesheet link only for SSG routes); layout rule (html+`setRequestLocale`+`generateStaticParams` in `[locale]/layout.tsx`); i18n/metadata rule (pass `locale` explicitly to `getTranslations` inside `generateMetadata`).

---

## MILESTONES — Verifiable Goals

| M | Scope | Status | Remaining gate |
|---|---|---|---|
| **M0** | Scaffold+baseline | **DONE** — `typecheck`, `eslint`, `next build` all green; deps pinned; migration `drizzle/0000_*.sql` **applied live on Neon** (`drizzle-kit migrate` ✓); DB confirmed: 5 products / 3 categories / 6 articles | — |
| **M1** | Catalog & i18n | **DONE** — `/ar` dir=rtl + Arabic, `/fr` dir=ltr + French (verified dev+prod HTML); **seeded products render with prices live** (`بطانية كروشي صوفية` 350 د.م، etc.) | — |
| **M2** | WhatsApp ordering | **DONE** — live: product page emits `wa.me/212600000000?text=<encoded ar msg>` (verified on PROD HTML); out-of-stock (wool-storage-basket) shows disabled pill, no wa link | replace placeholder `NEXT_PUBLIC_SHOP_PHONE` with real WhatsApp number |
| **M3** | Content & SEO | **DONE** — 6 seeded articles render ar+fr; sitemap.xml (absolute URLs verified on live) + robots.txt live; **keywords+description meta ar/fr + homepage gallery montage + real product photos deployed and verified live** | Lighthouse SEO ≥ 90 on deployed preview (env + content now in place) |
| **M4** | Admin | **DONE** — 401/307 guard without cookie, 200 with valid session cookie (dashboard/products/categories/articles); **persist+reflect verified against live Postgres**: insert→public detail + admin list show row, delete→public 404 | server-action HTTP POST transport itself (React/Next boundary) deferred to browser check on preview — DB-level write path validated via same drizzle schema |
| **M5** | Telemetry & hardening | Build done; `<Analytics/>` wired (client-injected, active on Vercel); selfcheck (12/12) + dev/prod smoke suite recorded in `PROJECT_MAP`+logs | Lighthouse run + console-error sweep on deployed preview |

**Out of scope now**: payments, cart, accounts, reviews, newsletters, stock/variants, media service, multi-admin.

---

## [DIGITAL PIVOT — v2 storefront (payment + PDF delivery) · 2026-09-18]

### Decisions (this session)
- **Business pivot**: digital products store — sell crochet **photo patterns as PDFs**; drop WhatsApp/COD entirely (no `wa.me` anywhere).
- **Gateway**: CIH **CMI** (CIB "3D_PAY_HOSTING" flow). `PAYMENT_PROVIDER=mock` until merchant keys arrive → `cmi` when `PAYMENT_PROVIDER=cmi` + `CMI_CLIENT_ID`/`CMI_STORE_KEY`/`CMI_BASE_URI` set.
- **Delivery**: automatic, secured — signed expiring download link after payment; PDF is watermarked **per buyer** (order ref + email + name, diagonal, per page) via pdf-lib **before** streaming. 5-download / 7-day cap.
- **Honest limit (stated to user)**: 100% anti-screenshot is impossible; protection = low-res watermarked previews + post-payment delivery + buyer watermark (traceability).

### Schema (migrations `0001`, `0002` applied live on Neon)
- `products.fileKey text`, `products.fileMime text default 'application/pdf'`
- `orders(id, ref UNIQUE, name, email, locale default 'ar', currency default 'MAD', totalMAD, status pending|paid|failed, provider cmi|mock, providerRef, downloadCount, paidAt, createdAt, updatedAt)`
- `order_items(id, orderId FK cascade, productId FK, title, priceMAD, fileKey, qty default 1)` — `countAllOrders()` added.

### Code added (all new)
- `src/features/orders/{ref,queries,download-token,files,pdf,payment,actions}.ts` — refs `XXXX-YYYY`; HMAC tokens `dl1.ref.exp.sig` (SHA-256 base64url, ADMIN_SECRET); path-traversal-safe reads under `private/`; watermark via **Geist-Regular.ttf (MIT, vendored `private/fonts/`)** + `@pdf-lib/fontkit` — **avoids pdf-lib's broken `@pdf-lib/standard-fonts` `.json` under Node v26**; CMI form/hash (HMAC-SHA512 base64 over sorted `key=value` pipe-joined, per CMI kit — exact field order to be re-verified with merchant kit); mock fallback.
- Pages: `[locale]/products/[slug]/buy` (BuyForm), `[locale]/pay/cmi/[ref]` (auto-submit), `[locale]/pay/mock/[ref]` (simulate button), `[locale]/orders/[ref]` (status + download link), `[locale]/admin/orders` (+ admin dashboard total orders card), API `api/payments/mock`, `api/payments/cmi/{return,callback}`, download route `d/[token]`.
- `src/components/{buy-form,cmi-auto-form,watermarked-image}.tsx` — WatermarkedImage (drag/contextmenu/user-select guards + overlay) applied to product-card, gallery and product detail.
- Security: `next.config.ts` headers (CSP incl. `form-action https://*.cmi.co.ma`, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy; no-store/noindex on `/d`, `/admin`, `/api/payments`), robots disallow (`/admin`, `/d`, `/orders`, `/api/payments`, `/buy`), admin+pay+orders layouts `<meta robots noindex>`, login rate-limit (8 tries / 10 min in-memory), `NEXT_PUBLIC_SHOP_PHONE` removed from Vercel env.
- Seed: products now digital patterns (ar/fr metadata rewritten — no more WhatsApp/COD), `fileKey` set, `inStock true` ×5; `scripts/gen-seed-pdfs.cjs` generates placeholder PDFs into `private/files/`.

### Verified
- Gates green: `tsc --noEmit`, `eslint`, `next build`, `selfcheck` (18/18).
- **Local E2E (27/27)**: order pending → mock pay page → simulate 303 → paid → order page → `/d/<token>` `%PDF` watermarked → cap 5 → tampered/garbage rejected → product page no `wa.me`, buy link → admin noindex.
- **PRODUCTION E2E on Vercel (27/27)**: same flow live at `site-web-digital-products.vercel.app` incl. on-platform watermarking; robots.txt + CSP/no-sniff/DENY verified over HTTPS.
- Note: `@pdf-lib/standard-fonts` `.compressed.json` files crash under Node v26 ESM-interception (tsx file-mode) → all runtime/bundled paths use the vendored TTF via fontkit (works on Vercel Node runtime).

### PENDING / operator actions
- **CIH merchant credentials** (clientid/storekey/endpoint) → flip `PAYMENT_PROVIDER=cmi` + set `CMI_CLIENT_ID/CMI_STORE_KEY/CMI_BASE_URI` in Vercel env; verify CMI test payment E2E; confirm hash field set/order with CMI kit.
- **Move real paid PDFs out of the repo** to object storage (Vercel Blob / R2 / S3) before selling real content — `private/files/*` currently holds only placeholders (OK to ship).
- **Rotate Neon credentials** (shared in chat this session) once live.
- `dev.log` is tracked in git (runtime noise) — remove + add `dev*.log` to `.gitignore`.
- Watermark font is Latin-only (Geist): Arabic buyer names render as blanks on the PDF line; email+ref (ASCII) always present. Add an Arabic TTF if needed.
- Mock orders left after E2E are truncated from DB (manual runs of `scripts/cleanup-orders.ts`; not committed).

---

## [RIB / VIREMENT + WHATSAPP CONFIRM FLOW — v2.1 · 2026-09-18]

> Chosen over CMI for immediate launch: no bank contract needed — the buyer transfers to the seller's CIH account, the seller confirms receipt, then sends the signed PDF download link. Fully live.

### Design
- New provider mode `rib` (`PAYMENT_PROVIDER=rib` on Vercel prod). `paymentMode()`: CMI (if configured) → rib → mock fallback. `orders.provider` is free text (no migration).
- `buyProduct` already redirects by mode → `/[locale]/pay/[mode]/[ref]`; `rib` resolves to the new page. No action change needed.
- `ribConfig()` (env): `RIB_IBAN` (default = real CIH IBAN), `RIB_NUMBER` (24-digit RIB, default set), `RIB_SWIFT`, `RIB_HOLDER` (optional), `NEXT_PUBLIC_SHOP_PHONE`. IBAN and RIB are the same account (IBAN = `MA` + check digits + RIB); both shown on the page with copy buttons.
- `buildRibWhatsappUrl()` builds the buyer→seller confirm message (locale-aware, includes **product title + registered buyer name + price + order ref + IBAN**, and prompts the buyer to send their **full name as it will appear on the transfer** + the **virement reference (réf)** for matching); phone from `NEXT_PUBLIC_SHOP_PHONE`. (wa.me links carry text only — a product image needs WhatsApp Business API; out of scope.)
- New page `src/app/[locale]/pay/rib/[ref]/page.tsx`: amount + ref, IBAN/SWIFT/holder with copy buttons, WhatsApp confirm CTA, explanatory note. Pending-only (redirects to order page otherwise); provider-guarded; noindex (pay layout).

### Delivery (half-automatic)
1. Buyer fills checkout → order `pending` (provider `rib`) → sees the RIB + WhatsApp button.
2. Buyer transfers and taps the button → WhatsApp opens with a ready message (ref + amount). Seller receives it.
3. Seller verifies the bank credit, then in **Admin → Orders** taps `تمكين كمدفوعة` and **`نسخ رابط التحميل`** (new `CopyButton`, full `/d/<token>` URL) and pastes it back in the WhatsApp chat.
4. Buyer opens the signed link → watermarked PDF (5 downloads / 7 days). Same secured `/d/` pipeline as CMI.

### New/changed files
- `src/features/orders/payment.ts` — `PaymentMode` gains `rib`; `ribConfig()`, `buildRibWhatsappUrl()`; `paymentMode()` order.
- `src/app/[locale]/pay/rib/[ref]/page.tsx` (new); `src/components/copy-button.tsx` (new, client).
- `src/app/[locale]/admin/orders/page.tsx` — copy-download-link button on paid rows (uses `signDownload` + `NEXT_PUBLIC_SITE_URL`).
- i18n ar/fr: `order.rib*` strings + `admin.copyLink`/`copyLinkCopied`.
- `next.config.ts` — `/pay/:path*` no-store + noindex; `/orders/:path*` noindex. `robots.ts` — disallow `/pay/`.
- `scripts/selfcheck.ts` — rib config / wa-link / payment-mode checks. `scripts/e2e-local.ts` — rib page + robots checks (now **32/32**).

### Verified live (site-web-digital-products.vercel.app)
- Prod env: `PAYMENT_PROVIDER=rib`, `NEXT_PUBLIC_SHOP_PHONE=212603017198`, `RIB_IBAN=MA64 2300 1057 6579 1211 0187 0061`, `RIB_SWIFT=CIHMMAMC`. `NEXT_PUBLIC_SHOP_PHONE` re-added after earlier removal.
- Production E2E **35/35 PASS** incl. rib page 200 / IBAN + RIB + product title + **registered buyer name** shown / `wa.me/212603017198` / noindex / robots `/pay/`; full mock→watermark→cap→reject path still green.
- Test orders truncated after run.

## [GLOBAL STOREFRONT (country-free copy + approx USD/EUR) — v2.3 · 2026-09-18]

- Removed all "المغرب / Morocco / Maroc / مغربي / marocain" mentions from meta tagline, descriptions, keywords, and hero titles across ar/fr/en, plus the seed + live product descriptions (scarf) — storefront is presented as a worldwide digital shop.
- Prices now display MAD **plus** an approximate conversion (`approxTotal` in `src/lib/format.ts`: fixed approx rates MAD→USD 10, MAD→EUR 11; en→USD, ar/fr→EUR) on product cards, product detail, checkout summary, and the paid-order page. Base price stays `priceMAD` (account is in MAD) — rates adjustable in the constants.
- e2e asserts no country mention on `/ar,/fr,/en` homes + scarf page, and approx-currency presence; production E2E **43/43 PASS**. Gates green. Deployed live.

## [LOCALE LOCK + NEW PRICING — v2.4 · 2026-09-18]

- **Locale lock via middleware** (`src/middleware.ts`): any request whose `NEXT_LOCALE` cookie is set is forced to that locale — root `/` and even `/ar|/fr|/en` paths redirect to the remembered language. Once you pick a language it sticks across the whole site (home included); `_next/api/d/static` are exempt. Reverting is just clicking another language pill.
- Go-live E2E: **47/47 PASS** (incl. cookie-lock on `/`→`/en` and `/ar/products`→`/en/products`). Gates green. Deployed live.

### STILL OPEN for "worldwide buying"
- Card payment (CIH/CMI) seam is built (`PAYMENT_PROVIDER=cmi`) but merchant keys/kit still needed to accept real cards; RIB virement remains Morocco/personal-transfer oriented.

---

## [FULL-LANGUAGE PRODUCT CONTENT + USD PRICING — v2.5 · 2026-09-18]

- **English product content (schema migration)**: added `title_en` + `description_en` (products) and seeded/live-updated all 5 products. `localTitle(locale, ar, fr, en="")` now returns English content for `en` (falls back to French when empty); wired through product-card, gallery, detail page (+meta), buy page, rib page, admin products list. Admin product form gained Title/Description (English) fields.
- **Exact USD pricing (display)**: added `price_usd` (integer cents) as the worldwide display price + kept `price_mad` (integer) as the payment/transfer amount. New shared `PriceBlock` component (`src/components/price.tsx`) renders exact USD (`$4.99`, or `4,99 $US` ar/fr) with the MAD amount as secondary on cards/detail/buy; falls back to MAD+approx when `priceUSD=0`. New `formatUsd` in `src/lib/format.ts`; admin form gains Price (USD).
- New product prices: blanket **$4.99** (54 MAD), doll **$6.59** (71), scarf **$3.99** (43), basket **$5.49** (59), kit **$7.99** (86).
- TDD: e2e first failed the 3 new English/USD assertions, then passed after implementation. Prod E2E **44/44 PASS**, gates green, deployed live.

### KNOWN LIMITATIONS / DEBT (registered per protocol 4)
- Articles are ar/fr only (`locale` column) — English UI shows French articles on `/en` list. Pre-existing design.
- Web watermark (Geist Latin font) is Latin-only; Arabic names degrade silently (pre-existing).

### STILL PENDING (operator)
- `RIB_HOLDER` (account holder name) not set on Vercel — page hides the row while empty.

---

## [ENGLISH LOCALE (ar/fr/en) — v2.2 · 2026-09-18]

- `next-intl` routing now `["ar","fr","en"]` (default still `ar`); new `src/lib/i18n/messages/en.ts` (full mirror of the Messages shape: meta/nav/home/product/order incl. rib flow/admin/article/footer).
- `LocaleSwitch` upgraded from a 2-way toggle to a 3-language switcher (العربية / Français / English), stores `NEXT_LOCALE` cookie; root `/` honors `ar|fr|en`.
- `formatMAD` maps en→`en` Intl tag (`MAD 350`); new `localTitle(locale, ar, fr)` helper used across product-card/gallery/detail/buy/rib/admin/forms — **English falls back to the French (Roman-script) product content** (schema only stores title/description in ar+fr; documented content limitation).
- WhatsApp confirm message, CMI `lang`, mock route locale, admin login redirects, order creation, sitemap — all accept `en`.
- e2e now exercises `/en` + an English rib order (heading "Bank transfer payment"); production E2E **38/38 PASS**. Gates (tsc/eslint/build/selfcheck) green. Deployed live.

---

## [US-MARKET ENGLISH COPY + TRUST BLOCK + ENGLISH CATEGORIES — v2.6 · 2026-09-19]

- **English copy (US-market)**: all 5 titles now end `… Pattern – PDF` / `… Guide – PDF`, and English descriptions were rewritten to sales-ready US-English (blanket uses the user-supplied copy "Create your own beautiful crochet Afghan blanket…", doll/scarf/basket/kit upgraded). Applied in `seed.ts` + live DB.
- **Trust block (no fake reviews)**: new `src/components/trust.tsx` (async server comp, `getTranslations("product")`), rendered on product detail under the description with exactly 4 factual bullets: 🔒 Secure checkout · ⚡ Instant download · 📄 PDF digital product · ❌ No physical product shipped. NO rating stars / no "Loved by crochet makers" — user forbade fake social proof until there is real evidence.
- **English categories**: added `categories.name_en` (schema + live `ALTER TABLE … ADD COLUMN name_en`) — Crochet / Handmade / Kits. Wired via `localTitle(…, nameEn)` in product pills, detail category label, admin product form select, admin categories list (`c.name · c.nameFr · c.nameEn`). Admin category form gained Name (English) field; `categorySchema` + save action parse `nameEn`.
- i18n: added `product.trustSecure/trustInstant/trustPdf/trustNoShip` in ar/fr/en.
- Note: prod measure — user's "French title on /en" screenshot was stale/cached; live production already served the English title pre-v2.6. Live fetch of `/en/products/crochet-afghan-blanket` shows new copy + trust + "Handmade" (no "Fait main").
- TDD: 3 new e2e asserts (English description snippet, 🔒+Instant download, Handmade with no "Fait main") red first, green after. Prod E2E on canonical alias **47/47 PASS**, gates green, deployed live (deployment-specific URL is SSO-protected; canonical production alias is public and serves the new build).
- Test orders cleaned up (dev DB `orders` empty).

## [ENGLISH DEFAULT LANDING — v2.7 · 2026-09-19]

- **English is now the default entry**: `defaultLocale` flipped ar→en in `src/lib/i18n/routing.ts`, and the root fallback in `src/app/page.tsx` (cookie-less → `/en`). New visitors land on the English US-market storefront; العربية/Français stay one click away in the pill switcher, and the `NEXT_LOCALE` cookie lock middleware is unchanged (overrides everything once chosen).
- TDD: new e2e assert "root defaults to english" failed against the old build (red), passed after deploy (green). Prod E2E **48/48 PASS** on canonical alias, gates green, deployed live. Root probe: `GET /` → **307 /en**.
- Test orders cleaned up.

## [SALES CONVERSION PASS — v2.8 · 2026-09-19]

- **Price consistency guard (🔴 critical)**: live audit found **no stale prices** — `/en` product card, detail, and buy page all show `$4.99` (the reported "MAD 350 ≈ $35" was the user's browser cache of the pre-2026 pricing). Added 2 regression e2e asserts: detail page never contains `350`, and buy page price matches product (`$4.99`, no `350`).
- **Home hero repositioned to selling the right product**: title → "Crochet Patterns & Digital Guides for Beginners and Creators" (all 3 locales), subheadline → "Instant PDF downloads • Step-by-step instructions • Learn, create & crochet", CTA → "Explore Crochet Patterns". Users arriving from ads now immediately understand it's **digital PDFs**.
- **Product detail conversion blocks** (above the Buy Now button, i18n in ar/fr/en):
  - `What's included` — 7 items with emojis 📘📸🧶✂️📐🎓⚡ (Detailed PDF pattern, Step-by-step photos, Materials list, Required tools, Finished size, Difficulty level, Instant download).
  - `Perfect for` — chips: Crochet beginners / Handmade lovers / DIY creators / Gift makers.
  - `Skill level` + `Language` rows (currently "Beginner / Intermediate", "English" — static defaults; real PDFs are still placeholders, so these claims must be honored/corrected when the real files are uploaded).
  - `DIGITAL PRODUCT — PDF ONLY` badge rendered directly above the Buy Now button (product has a `fileKey`).
- TDD: 2 new asserts (hero wording, spec+badge) red against previous build, green after; prod E2E **52/52 PASS**, gates green, deployed live. Test orders cleaned up.

## [NEW PRODUCT PHOTOS (CYRUS 7–12) + ALL-PATTERNS BUNDLE — v2.9 · 2026-09-19]

- **New product photos** (user-provided `CYRUS7.png`…`CYRUS12.png`, note the source file `CYRUS9].png` has a stray `]`): resized via the standard `System.Drawing` pipeline (max 1400px, JPEG q82) → `public/img/shop/by-cyrus-{7..12}.jpg`. Assignment confirmed by user: **7→Amigurumi Doll, 8→Wool Scarf, 9→Storage Basket, 10→Afghan Blanket, 11→Beginner's Guide, 12→Bundle**.
- **New bundle product** `crochet-patterns-bundle` — "Complete Crochet Patterns Bundle – PDF", all 5 patterns at a special price **$19.99 ≈ 193 MAD** (separate total would be $29.05), image `by-cyrus-12.jpg`, category Kits, `featured`, placeholder `crochet-bundle.pdf` (40-page watermark-stamped mock) generated via `scripts/gen-seed-pdfs.cjs` (entry added; all PDFs regenerated deterministically).
- Applied in `seed.ts` + live Neon DB (update images by slug + idempotent bundle insert). Note: product content is DB-driven, so the product-detail pages served the new price/paths immediately; the deploy ships the static image files + updated seed.
- Prod E2E **61/61 PASS** (new asserts: bundle page $19.99 + by-cyrus-12.jpg, bundle on products list, bundle on home gallery, blanket page uses by-cyrus-10.jpg), all 6 `/img/shop/by-cyrus-*.jpg` return **200** on prod, gates green, deployed live. Test orders cleaned up.
- **REVERTED same session (user request):** CYRUS7–12 photos restored to the classic `by-cyrus-{1..6}.jpg` (byte-identical regeneration from the original `BY SCYRUS 1.png`…`CYRUS6.png` sources via `scripts/resize-photos.ps1`); `seed.ts` + live DB images and the home gallery `CELLS` back to 1–6 (tile 6 → gallery badge, no slug). The **bundle product stays** (all 5 patterns, `$19.99 ≈ 193 MAD`, image `by-cyrus-12.jpg`, `crochet-bundle.pdf`). Unused `by-cyrus-{7..11}.jpg` left on disk (not referenced anywhere). e2e checks updated to assert classic images (blanket shows `by-cyrus-1.jpg`, gallery shows `by-cyrus-6.jpg` without `by-cyrus-7.jpg`). Prod E2E **62/62 PASS**, gates green, redeployed live. Test orders cleaned up.

---

---
