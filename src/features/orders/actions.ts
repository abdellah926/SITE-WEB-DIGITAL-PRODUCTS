"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getProductBySlug } from "@/features/catalog/queries";
import { paymentMode } from "./payment";
import { createOrder } from "./queries";

export interface BuyState {
  error?: string;
}

const schema = z.object({
  name: z.string().trim().min(2, "errorRequired").max(120),
  email: z.string().trim().email("errorInvalidEmail").max(200),
  locale: z.enum(["ar", "fr", "en"]),
});

export async function buyProduct(
  _prev: BuyState,
  formData: FormData
): Promise<BuyState> {
  const slug = String(formData.get("slug") ?? "");
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "errorRequired" };
  }
  const product = await getProductBySlug(slug);
  if (!product) return { error: "errorNotFound" };
  if (!product.fileKey) return { error: "errorNotDigital" };
  if (!product.inStock) return { error: "errorOutOfStock" };

  const order = await createOrder({
    name: parsed.data.name,
    email: parsed.data.email,
    locale: parsed.data.locale,
    totalMAD: product.priceMAD,
    provider: paymentMode(),
    item: {
      productId: product.id,
      title: product.title,
      priceMAD: product.priceMAD,
      fileKey: product.fileKey,
    },
  });
  if (!order) return { error: "errorDbDown" };

  redirect(`/${parsed.data.locale}/pay/${paymentMode()}/${order.ref}`);
}