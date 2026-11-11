// Extracts embedded raster images from the Master Plan PDF so the 3D stand-in
// vehicle renders (CC BY model, credited in Section 23) can be reused in the
// prototype. Soft masks are re-applied so cut-outs keep their transparency.
// Usage: node scripts/extract-standins.mjs <out-dir>
import fs from "node:fs";
import path from "node:path";
import * as mupdf from "mupdf";

const pdfPath = "Raptors_Auto_Group_Master_Plan_v5.pdf";
const outDir = process.argv[2] ?? "tmp-extract";
fs.mkdirSync(outDir, { recursive: true });

const doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
const seen = new Set();
let count = 0;

function withAlpha(image) {
  const rgb = image.toPixmap();
  if (rgb.getNumberOfComponents() !== 3) return rgb;
  // getNumberOfComponents() already counts the alpha channel
  const sn = rgb.getNumberOfComponents();
  const mask = typeof image.getMask === "function" ? image.getMask() : null;
  if (!mask) return rgb;
  const m = mask.toPixmap();
  const w = rgb.getWidth();
  const h = rgb.getHeight();
  if (m.getWidth() !== w || m.getHeight() !== h) return rgb;
  const out = new mupdf.Pixmap(mupdf.ColorSpace.DeviceRGB, [0, 0, w, h], true);
  const src = rgb.getPixels();
  const ms = m.getPixels();
  const mn = m.getNumberOfComponents();
  const dst = out.getPixels();
  for (let i = 0; i < w * h; i++) {
    const a = ms[i * mn];
    // mupdf pixmaps with alpha are premultiplied
    dst[i * 4] = Math.round((src[i * sn] * a) / 255);
    dst[i * 4 + 1] = Math.round((src[i * sn + 1] * a) / 255);
    dst[i * 4 + 2] = Math.round((src[i * sn + 2] * a) / 255);
    dst[i * 4 + 3] = a;
  }
  return out;
}

for (let p = 0; p < doc.countPages(); p++) {
  const page = doc.loadPage(p);
  const text = page.toStructuredText("preserve-images");
  let n = 0;
  text.walk({
    onImageBlock(_bbox, _matrix, image) {
      const w = image.getWidth();
      const h = image.getHeight();
      if (w < 200 || h < 120) return;
      const png = withAlpha(image).asPNG();
      const key = `${w}x${h}-${png.length}`;
      if (seen.has(key)) return;
      seen.add(key);
      fs.writeFileSync(path.join(outDir, `p${String(p + 1).padStart(2, "0")}-${n++}-${w}x${h}.png`), png);
      count++;
    },
  });
}
console.log(`Extracted ${count} unique images to ${outDir}`);
