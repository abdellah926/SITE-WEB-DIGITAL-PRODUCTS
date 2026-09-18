import { NextRequest } from "next/server";
import { getOrderByRef, incrementDownloads } from "@/features/orders/queries";
import {
  verifyDownload,
  MAX_DOWNLOADS,
} from "@/features/orders/download-token";
import { readPrivateFile } from "@/features/orders/files";
import { watermarkPdf } from "@/features/orders/pdf";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const orderRef = verifyDownload(token);
  if (!orderRef) {
    return new Response("Lien invalide ou expiré", { status: 404 });
  }

  const order = await getOrderByRef(orderRef);
  const item = order?.items[0];
  if (!order || order.status !== "paid" || !item) {
    return new Response("Commande introuvable", { status: 404 });
  }
  if (order.downloadCount >= MAX_DOWNLOADS) {
    return new Response("Limite de téléchargements atteinte", { status: 403 });
  }

  const file = await readPrivateFile(`files/${item.fileKey}`);
  if (!file) {
    return new Response("Fichier introuvable", { status: 404 });
  }

  const output = await watermarkPdf(file, {
    header: "Crochet&Handmade — vente digitale",
    lines: [
      `Commande ${order.ref}`,
      order.email,
      order.name,
      new Date().toISOString().slice(0, 10),
    ],
  });
  if (!output) {
    log("error", "download blocked: watermark failed", order.ref);
    return new Response("Fichier temporairement indisponible", { status: 500 });
  }

  await incrementDownloads(order.id);

  const slug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const filename = `${slug || "fichier"}.pdf`;

  return new Response(output as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(output.byteLength),
      "Cache-Control": "private, no-store, no-transform",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}