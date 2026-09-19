"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { Category, Product } from "@/lib/db/schema";
import type { Article } from "@/lib/db/schema";
import { localTitle } from "@/lib/format";
import {
  loginAction,
  saveArticleAction,
  saveCategoryAction,
  saveProductAction,
} from "@/features/admin/actions";
import type { FormState } from "@/features/admin/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-700 focus:outline-none";

function ErrorBox({ state }: { state: FormState }) {
  const t = useTranslations("admin.errors");
  if (!state.error) return null;
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {t(state.error as "required")}
    </p>
  );
}

function SavedNote({ state }: { state: FormState }) {
  const t = useTranslations("admin.errors");
  return state.saved ? (
    <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{t("saved")}</p>
  ) : null;
}

/* ---------- auth ---------- */

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("admin");
  const [state, action] = useActionState(loginAction, {});
  return (
    <form
      action={action}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="locale" value={locale} />
      <ErrorBox state={state} />
      <Field label={t("passwordLabel")}>
        <input type="password" name="password" required className={inputCls} autoFocus />
      </Field>
      <SubmitButton label={t("submit")} />
    </form>
  );
}

/* ---------- products ---------- */

export function ProductForm({
  locale,
  product,
  categories,
}: {
  locale: string;
  product?: Product;
  categories: Category[];
}) {
  const t = useTranslations("admin");
  const [state, action] = useActionState(saveProductAction, {});
  const f = t.raw("fields") as Record<string, string>;
  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="locale" value={locale} />
      <SavedNote state={state} />
      <ErrorBox state={state} />
      <Field label={f.title}>
        <input name="title" defaultValue={product?.title} required className={inputCls} />
      </Field>
      <Field label={f.titleFr}>
        <input name="titleFr" defaultValue={product?.titleFr} required className={inputCls} />
      </Field>
      <Field label={f.titleEn}>
        <input name="titleEn" defaultValue={product?.titleEn} className={inputCls} />
      </Field>
      <Field label={f.slug}>
        <input name="slug" defaultValue={product?.slug} required pattern="[a-z0-9-]+" className={inputCls} />
      </Field>
      <Field label={f.description}>
        <textarea name="description" defaultValue={product?.description} required rows={3} className={inputCls} />
      </Field>
      <Field label={f.descriptionFr}>
        <textarea name="descriptionFr" defaultValue={product?.descriptionFr} required rows={3} className={inputCls} />
      </Field>
      <Field label={f.descriptionEn}>
        <textarea name="descriptionEn" defaultValue={product?.descriptionEn} rows={3} className={inputCls} />
      </Field>
      <Field label={f.price}>
        <input name="priceMAD" type="number" min={0} step={1} defaultValue={product?.priceMAD} required className={inputCls} />
      </Field>
      <Field label={f.priceUSD}>
        <input
          name="priceUSD"
          type="number"
          min={0}
          step={0.01}
          defaultValue={product ? (product.priceUSD / 100).toFixed(2) : ""}
          className={inputCls}
        />
      </Field>
      <Field label={f.category}>
        <select name="categoryId" defaultValue={product?.categoryId ?? ""} className={inputCls}>
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {localTitle(locale, c.name, c.nameFr, c.nameEn)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={f.images}>
        <textarea
          name="images"
          defaultValue={product?.images.join("\n") ?? ""}
          rows={3}
          className={inputCls}
        />
      </Field>
      <div className="flex gap-6">
        {(["inStock", "featured"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              name={key}
              defaultChecked={product ? product[key] : key === "inStock"}
              className="h-4 w-4 accent-amber-700"
            />
            {f[key]}
          </label>
        ))}
      </div>
      <SubmitButton label={product ? t("actions.save") : t("actions.create")} />
    </form>
  );
}

/* ---------- categories ---------- */

export function CategoryForm({ category }: { category?: Category }) {
  const t = useTranslations("admin");
  const [state, action] = useActionState(saveCategoryAction, {});
  const f = t.raw("fields") as Record<string, string>;
  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <SavedNote state={state} />
      <ErrorBox state={state} />
      <Field label={f.title}>
        <input name="name" defaultValue={category?.name} required className={inputCls} />
      </Field>
      <Field label={f.titleFr}>
        <input name="nameFr" defaultValue={category?.nameFr} required className={inputCls} />
      </Field>
      <Field label={f.titleEn}>
        <input name="nameEn" defaultValue={category?.nameEn} className={inputCls} />
      </Field>
      <Field label={f.slug}>
        <input name="slug" defaultValue={category?.slug} required pattern="[a-z0-9-]+" className={inputCls} />
      </Field>
      <SubmitButton label={category ? t("actions.save") : t("actions.create")} />
    </form>
  );
}

/* ---------- articles ---------- */

export function ArticleForm({ article }: { article?: Article }) {
  const t = useTranslations("admin");
  const [state, action] = useActionState(saveArticleAction, {});
  const f = t.raw("fields") as Record<string, string>;
  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6">
      <input type="hidden" name="id" value={article?.id ?? ""} />
      <SavedNote state={state} />
      <ErrorBox state={state} />
      <Field label={f.title}>
        <input name="title" defaultValue={article?.title} required className={inputCls} />
      </Field>
      <Field label={f.slug}>
        <input name="slug" defaultValue={article?.slug} required pattern="[a-z0-9-]+" className={inputCls} />
      </Field>
      <Field label={f.excerpt}>
        <input name="excerpt" defaultValue={article?.excerpt} required className={inputCls} />
      </Field>
      <Field label={f.body}>
        <textarea name="body" defaultValue={article?.body} required rows={8} className={inputCls} />
      </Field>
      <Field label={f.locale}>
        <select name="locale" defaultValue={article?.locale ?? "ar"} className={inputCls}>
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
        </select>
      </Field>
      <Field label={f.image}>
        <input name="image" defaultValue={article?.image ?? ""} className={inputCls} />
      </Field>
      <SubmitButton label={article ? t("actions.save") : t("actions.create")} />
    </form>
  );
}

/* ---------- delete ---------- */

export function ConfirmDelete({
  action,
  id,
  label,
}: {
  action: (fd: FormData) => Promise<void>;
  id: number;
  label: string;
}) {
  return (
    <form action={action} onSubmit={() => window.confirm(label + "?")} className="inline">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm text-red-600 hover:text-red-800">
        {label}
      </button>
    </form>
  );
}