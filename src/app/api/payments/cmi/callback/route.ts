import { NextRequest, NextResponse } from "next/server";
import { getOrderByRef, markFailed, markPaid } from "@/features/orders/queries";
import { returnCode, verifyCmiReturn } from "@/features/orders/payment";

export async function POST(req: NextRequest) {
  const fields: Record<string, string> = {};
  const body = await req.formData();
  for (const key of body.keys()) fields[key] = String(body.get(key) ?? "");

  if (!verifyCmiReturn(fields)) {
    return NextResponse.json({ status: "bad_signature" }, { status: 400 });
  }

  const order = await getOrderByRef(fields.oid ?? "");
  if (!order) {
    return NextResponse.json({ status: "order_not_found" }, { status: 404 });
  }

  const txn = fields.transid ?? fields.TransId ?? undefined;
  if (returnCode(fields) === "00") {
    await markPaid(order.id, txn);
    return NextResponse.json({ status: "ok" });
  }
  await markFailed(order.id, txn);
  return NextResponse.json({ status: "declined" });
}