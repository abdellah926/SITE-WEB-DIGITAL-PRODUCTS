# Crochet&Handmade — Morocco handmade & crochet storefront

Handmade products, gift ideas, and crochet tutorials for the Moroccan market.
Single-owner content site with a public catalog + WhatsApp ordering (COD) and a minimal in-app admin.

## Stack

- **Next.js 16.3.5** (App Router, Server Components) · **React 19.2.8** · **TypeScript 5.9.3**
- **Tailwind CSS 4.3.3** · **Lucide icons** · **next-intl 4.14.5** (ar RTL + fr)
- **Drizzle ORM 0.45.2** + PostgreSQL · **zod 4.6.5** · **@vercel/analytics 2.0.1**

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # production build
```

### Database

Copy `.env.example` → `.env.local` and set `DATABASE_URL` (PostgreSQL).

```bash
npm run db:generate  # generate SQL migration into ./drizzle
npm run db:push      # apply schema to the database
npm run db:seed      # insert seed products/categories/articles (ar + fr)
```

Without `DATABASE_URL` the app runs but pages show their empty states and the
admin shows a warning banner; no data can be persisted until it is configured.

### Admin

`/{locale}/admin` — login uses `ADMIN_PASSWORD`. Sessions are HMAC-signed cookies
(`ADMIN_SECRET`, ≥16 chars), valid 1h, httpOnly.

### Ordering

Products show a WhatsApp order button built from `NEXT_PUBLIC_SHOP_PHONE`
(no `+`, e.g. `212612345678`). If unset, buttons are hidden and a warning is logged.

## Layout

```
src/
  app/[locale]/...   public routes (home, products, articles) + /admin CRUD
  components/        header/footer/cards/locale-switch
  features/          catalog, content, orders, admin (queries + actions + forms)
  lib/               db (schema/client/seed), i18n, log, format
```

Architecture decisions and remaining operational inputs are tracked in
`PROJECT_MAP.md`.