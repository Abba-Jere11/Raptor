// Local review only: screenshots of the public pages at desktop and phone width.
// usage: node scripts/review-shots.cjs <outDir> <vehicleSlug> [soldSlug]
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const [outDir, vehicleSlug, soldSlug] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:3000";
const pages = [
  ["home", "/"],
  ["inventory", "/inventory"],
  ["vehicle", `/inventory/${vehicleSlug}`],
  ...(soldSlug ? [["vehicle-sold", `/inventory/${soldSlug}`]] : []),
];

(async () => {
  const browser = await chromium.launch();
  for (const width of [1440, 390]) {
    const dir = path.join(outDir, String(width));
    fs.mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [name, url] of pages) {
      errors.length = 0;
      await page.goto(base + url, { waitUntil: "networkidle", timeout: 180000 });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(600);
      const info = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        headings: [...document.querySelectorAll("h1, h2")].map((node) => node.textContent.trim()),
        framedPhotos: [...document.querySelectorAll("main img")].filter((img) => {
          const style = getComputedStyle(img);
          const parent = getComputedStyle(img.parentElement);
          return !img.alt.startsWith("Stand-in") && img.closest("dialog") === null && (style.objectFit === "contain" || parent.backgroundColor !== "rgba(0, 0, 0, 0)" || style.paddingTop !== "0px");
        }).length,
      }));
      await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
      console.log(JSON.stringify({ width, name, ...info, errors: [...errors] }));
    }
    await context.close();
  }
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
