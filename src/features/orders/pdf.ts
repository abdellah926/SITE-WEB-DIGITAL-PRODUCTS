import { PDFDocument, degrees, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { log } from "@/lib/log";
import { readPrivateFile } from "./files";

let fontBytes: Uint8Array | null | undefined;

async function loadWatermarkFont(): Promise<Uint8Array | null> {
  if (fontBytes !== undefined) return fontBytes;
  fontBytes = await readPrivateFile("fonts/Geist-Regular.ttf");
  if (!fontBytes) {
    log("error", "watermark font missing (private/fonts/Geist-Regular.ttf)");
  }
  return fontBytes;
}

export interface WatermarkText {
  header: string;
  lines: string[];
}

export async function watermarkPdf(
  source: Uint8Array,
  text: WatermarkText
): Promise<Uint8Array | null> {
  try {
    const fontSource = await loadWatermarkFont();
    if (!fontSource) return null;

    const doc = await PDFDocument.load(source, { ignoreEncryption: true });
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(fontSource, { subset: true });
    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      page.drawText(text.header, {
        x: 32,
        y: height - 36,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      let y = height / 2 + (text.lines.length * 22) / 2;
      for (const line of text.lines) {
        page.drawText(line, {
          x: width / 2 - 160,
          y,
          size: 15,
          font,
          color: rgb(0.85, 0.15, 0.15),
          rotate: degrees(30),
          opacity: 0.3,
        });
        y -= 22;
      }
    }
    return await doc.save();
  } catch (err) {
    log("error", "pdf watermark failed", String(err));
    return null;
  }
}