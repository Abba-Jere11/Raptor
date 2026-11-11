// Crops the interim light/dark lockups from Master Plan v5 page 15 (Figure 1).
import fs from "node:fs";
import path from "node:path";
import * as mupdf from "mupdf";

const outDir = "public/brand";
const pagePath = path.join(outDir, "page-15.png");
fs.mkdirSync(outDir, { recursive: true });

function loadPixmap(file) {
  return new mupdf.Image(fs.readFileSync(file)).toPixmap();
}

function crop(src, x0, y0, x1, y1) {
  return src.warp(
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ],
    Math.round(x1 - x0),
    Math.round(y1 - y0),
  );
}

if (!fs.existsSync(pagePath)) {
  const doc = mupdf.Document.openDocument(fs.readFileSync("Raptors_Auto_Group_Master_Plan_v5.pdf"), "application/pdf");
  const page = doc.loadPage(14);
  fs.writeFileSync(pagePath, page.toPixmap(mupdf.Matrix.scale(3, 3), mupdf.ColorSpace.DeviceRGB, false, true).asPNG());
}

const src = loadPixmap(pagePath);
const w = src.getWidth();
const h = src.getHeight();

// A4 landscape @ 3× (2526×1785): the two large lockup cards under the figure title.
const light = crop(src, w * 0.028, h * 0.09, w * 0.305, h * 0.312);
const dark = crop(src, w * 0.315, h * 0.09, w * 0.538, h * 0.312);
fs.writeFileSync(path.join(outDir, "emblem-light.png"), light.asPNG());
fs.writeFileSync(path.join(outDir, "emblem-dark.png"), dark.asPNG());
// Compact header lockups (emblem + lettering in a row).
const lockupLight = crop(src, w * 0.028, h * 0.328, w * 0.288, h * 0.418);
const lockupDark = crop(src, w * 0.322, h * 0.328, w * 0.538, h * 0.418);
fs.writeFileSync(path.join(outDir, "lockup-light.png"), lockupLight.asPNG());
fs.writeFileSync(path.join(outDir, "lockup-dark.png"), lockupDark.asPNG());

fs.writeFileSync(
  path.join(outDir, "CREDITS.md"),
  "Interim emblems cropped from Raptors Auto Group Master Plan v5, Figure 1 (page 15). Replace with the final high-resolution logo file (Decision 8).\n",
);
console.log(
  `page ${w}x${h}  light ${light.getWidth()}x${light.getHeight()}  dark ${dark.getWidth()}x${dark.getHeight()}  lockup ${lockupLight.getWidth()}x${lockupLight.getHeight()}`,
);
