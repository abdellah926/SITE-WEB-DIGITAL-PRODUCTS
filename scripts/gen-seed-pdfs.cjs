const fs = require("node:fs");
const path = require("node:path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const FILES = [
  { key: "crochet-afghan-blanket.pdf", title: "Crochet Afghan Blanket Pattern" },
  { key: "amigurumi-doll.pdf", title: "Amigurumi Doll Pattern" },
  { key: "handmade-wool-scarf.pdf", title: "Handmade Wool Scarf Pattern" },
  { key: "wool-storage-basket.pdf", title: "Wool Storage Basket Pattern" },
  { key: "crochet-beginner-kit.pdf", title: "Crochet Beginner Guide" },
  { key: "crochet-bundle.pdf", title: "Complete Crochet Patterns Bundle" },
];

const OUT_DIR = path.join(process.cwd(), "private", "files");

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const { key, title } of FILES) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = 40;
    for (let i = 0; i < pages; i++) {
      const page = doc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();
      const cx = width / 2;
      const cy = height / 2;

      page.drawText("CROCHET & HANDMADE", {
        x: cx - 170,
        y: height - 90,
        size: 22,
        font,
        color: rgb(0.55, 0.4, 0.15),
      });
      page.drawText(title, {
        x: cx - 170,
        y: height - 130,
        size: 16,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      const stamp = "PAIEMENT REQUIS - EXEMPLE / PLACEHOLDER ONLY";
      for (let row = 0; row < 12; row++) {
        page.drawText(stamp, {
          x: 80,
          y: height - 220 - row * 70,
          size: 18,
          font,
          color: rgb(0.82, 0.82, 0.82),
        });
      }

      for (let d = -600; d < 1000; d += 180) {
        page.drawLine({
          start: { x: d, y: height },
          end: { x: d + 600, y: 0 },
          thickness: 1.5,
          color: rgb(0.8, 0.25, 0.2),
          opacity: 0.18,
        });
      }

      page.drawRectangle({
        x: 60,
        y: 60,
        width: width - 120,
        height: height - 120,
        borderColor: rgb(0.55, 0.4, 0.15),
        borderWidth: 1.5,
      });

      page.drawText(key + " - page " + (i + 1) + "/" + pages, {
        x: 70,
        y: 30,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    const bytes = await doc.save();
    fs.writeFileSync(path.join(OUT_DIR, key), bytes);
  }
  console.log("generated " + FILES.length + " placeholder PDFs in " + OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});