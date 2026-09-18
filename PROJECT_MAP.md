# PROJECT_MAP — Handmade / Crochet Storefront (Morocco)

> Status: IN PROGRESS — M0/M1 code-complete, live-DB steps gated on `DATABASE_URL`. Snapshot date: **2026-09-18** (Node v26.1.0).
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

- **PENDING (operator input, blocks acceptance)**: real `DATABASE_URL` (Postgres, e.g. Neon) — without it all data pages render verified empty states and CRUD cannot be exercised; migration `drizzle/0000_*.sql` exists and is applied via `drizzle-kit push`/`migrate`.
- **PENDING (operator input)**: real WhatsApp Business number (currently placeholder `NEXT_PUBLIC_SHOP_PHONE=212600000000`) + final pre-filled message templates ar/fr.
- **PENDING (operator input)**: real product photos to replace `public/img/*.svg` placeholders (5 products + article covers).
- **PENDING**: MAP keyword strategy for SEO (crochet terms ar/fr) — inputs for M3/G5 refinement.
- **PENDING (Phase 2)**: CMI/payment gateway, cart, inventory/variants, order DB, media pipeline, newsletter.
- **ORPHAN resolved**: currency formatting (`formatMAD`, `lib/format.ts`); seed dataset for 5 products + 6 articles produced as seed.ts + SVG placeholders.
- **Decisions recorded**: TS pinned to 5.9.3 and eslint to 9.39.5 (toolchain compat); `next lint` replaced by `eslint` directly; npm audit shows 4 moderate dev-only vulns inside drizzle-kit toolchain (no safe fix without breaking downgrade — accepted).

---

## MILESTONES — Verifiable Goals

| M | Scope | Status | Remaining gate |
|---|---|---|---|
| **M0** | Scaffold+baseline | **DONE** — `typecheck`, `eslint`, `next build` (Turbopack) all green; deps pinned; `drizzle-kit generate` produced `drizzle/0000_*.sql` (3 tables) | live DB migration (`drizzle-kit migrate`) — blocked on `DATABASE_URL` |
| **M1** | Catalog & i18n | **DONE** — `/ar`→dir=rtl + Arabic content, `/fr`→dir=ltr + French content (verified via `next build` SSR HTML + dev/prod curl), 404 for unknown routes, admin-guard redirect verified | render 5 seeded products with MAD pricing in a live DB |
| **M2** | WhatsApp ordering | Build done; `wa.me` URL builder covered by `npm run selfcheck` (host/encoding assertions pass) | E2E on a live in-stock product |
| **M3** | Content & SEO | Build done; 6 seeded articles (3 ar + 3 fr) written into seed.ts; sitemap.xml (6 URLs) + robots.txt + 404 verified in dev and prod | live-DB read; Lighthouse SEO ≥ 90 |
| **M4** | Admin | **DONE (code + guard verified)** — unauthenticated `/ar/admin`→307 login; valid session cookie→200 dashboard/products/categories; selfcheck asserts HMAC sign/verify/password/tamper/expiry | CRUD persistence E2E on live DB |
| **M5** | Telemetry & hardening | Build done; `<Analytics/>` wired (client-injected at runtime, active on Vercel); selfcheck + smoke suite documented | Lighthouse run + console-error sweep on deployed preview |

**Out of scope now**: payments, cart, accounts, reviews, newsletters, stock/variants, media service, multi-admin.