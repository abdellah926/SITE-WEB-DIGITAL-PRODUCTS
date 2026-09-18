import { NextRequest, NextResponse } from "next/server";
import { getOrderByRef, markFailed, markPaid } from "@/features/orders/queries";
import { returnCode, verifyCmiReturn } from "@/features/orders/payment";

async function handle(req: NextRequest): Promise<Response> {
  const fields: Record<string, string> = {};
  const url = new URL(req.url);
  for (const [k, v] of url.searchParams) fields[k] = v;
  if (req.method === "POST") {
    const body = await req.formData();
    for (const key of body.keys()) fields[key] = String(body.get(key) ?? "");
  }

  if (!verifyCmiReturn(fields)) {
    return NextResponse.json({ status: "bad_signature" }, { status: 400 });
  }

  const orderRef = fields.oid ?? "";
  const code = returnCode(fields);
  const order = await getOrderByRef(orderRef);
  if (!order) {
    return NextResponse.json({ status: "order_not_found" }, { status: 404 });
  }

  const txn = fields.transid ?? fields.TransId ?? undefined;

  if (code === "00") {
    await markPaid(order.id, txn);
    return NextResponse.redirect(
      new URL(`/${order.locale}/orders/${order.ref}?paid=1`, req.url),
      303
    );
  }
  await markFailed(order.id, txn);
  return NextResponse.redirect(
    new URL(`/${order.locale}/orders/${order.ref}?failed=1`, req.url),
    303
  );
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}