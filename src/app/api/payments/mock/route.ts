import { NextRequest, NextResponse } from "next/server";
import { getOrderByRef, markPaid } from "@/features/orders/queries";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const ref = String(form.get("ref") ?? "");
  const locale = form.get("locale") === "fr" ? "fr" : "ar";
  const order = await getOrderByRef(ref);
  if (!order || order.provider !== "mock") {
    return NextResponse.json({ status: "error" }, { status: 400 });
  }
  if (order.status !== "paid") {
    await markPaid(order.id, `mock-${Date.now()}`);
  }
  return NextResponse.redirect(
    new URL(`/${locale}/orders/${order.ref}?paid=1`, req.url),
    303
  );
}

export async function GET() {
  return NextResponse.json({ status: "error" }, { status: 405 });
}