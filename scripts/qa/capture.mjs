/**
 * Visual QA capture.
 *
 * Usage: node scripts/qa/capture.mjs [baseUrl] [outDir]
 * Requires a running server (npm run build && npm run start).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const base = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "qa/screenshots";
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const SECTIONS = [
  "reservas",
  "pagos",
  "panel",
  "caja",
  "estadisticas",
  "proximamente",
  "demo",
  "empezar",
  "preguntas",
  "contacto",
];

const browser = await chromium.launch();
let totalErrors = 0;

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    locale: "es-AR",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.screenshot({ path: `${OUT}/${vp.name}-hero.png` });
  await page.screenshot({ path: `${OUT}/${vp.name}-full.png`, fullPage: true });

  for (const id of SECTIONS) {
    const el = page.locator(`#${id}`);
    if ((await el.count()) === 0) {
      console.log(`MISSING SECTION: ${id}`);
      continue;
    }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await el.screenshot({ path: `${OUT}/${vp.name}-${id}.png` });
  }

  totalErrors += errors.length;
  console.log(`${vp.name} (${vp.width}px): ${errors.length} console errors`);
  for (const e of errors.slice(0, 8)) console.log("  !", e);
  await context.close();
}

await browser.close();
console.log(`done — ${totalErrors} console errors total`);
