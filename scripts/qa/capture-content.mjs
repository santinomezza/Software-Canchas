/**
 * Sets up a complex with gallery, services and location, then captures the
 * public page and the admin settings.
 *
 * Usage: node scripts/qa/capture-content.mjs [baseUrl]
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const shots = "C:/Users/santi/AppData/Local/Temp/kilo/content";
fs.mkdirSync(shots, { recursive: true });

const stamp = Date.now();
const owner = `demo${stamp}@test.com`;

const browser = await chromium.launch();
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/Argentina/Buenos_Aires",
  });
const page = await context.newPage();

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

// --- owner setup -------------------------------------------------------------
await page.goto(`${base}/registro`, { waitUntil: "networkidle" });
await page.fill("#name", "Complejo Los Sauces");
await page.fill("#email", owner);
await page.fill("#password", "claveSegura123");
await page.getByRole("button", { name: /Crear mi cuenta/i }).click();
await page.waitForURL(/\/panel/, { timeout: 20000 });
await page.waitForTimeout(1200);
console.log("after signup url:", page.url());
console.log("body:", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200));

await page.fill("#name", "Complejo Los Sauces");
await page.fill("#address", "Av. Costanera 1420");
await page.fill("#city", "Córdoba");
await page.check('input[name="sports"][value="padel"]');
await page.check('input[name="sports"][value="tenis"]');
await page.getByRole("button", { name: /^Guardar cambios/i }).click();
await page.waitForTimeout(1500);

await page.goto(`${base}/panel/canchas`, { waitUntil: "networkidle" });
for (const [name, sport, price] of [
  ["Pádel Norte", "padel", 22000],
  ["Pádel Sur", "padel", 22000],
  ["Tenis 1", "tenis", 18000],
]) {
  await page.fill("#court-name", name);
  await page.selectOption("#court-sport", sport);
  await page.fill("#court-price", String(price));
  await page.fill("#court-duration", "90");
  await page.fill("#court-deposit", "50");
  await page.getByRole("button", { name: /Agregar cancha/i }).click();
  await page.waitForTimeout(1100);
}

await page.goto(`${base}/panel/horarios`, { waitUntil: "networkidle" });
for (let day = 0; day < 7; day += 1) await page.uncheck(`#day-${day}-closed`);
await page.getByRole("button", { name: /^Guardar cambios/i }).click();
await page.waitForTimeout(1300);

// --- gallery ----------------------------------------------------------------
await page.goto(`${base}/panel/configuracion`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Pegar URL/i }).click();

const photos = [
  "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1200&q=80",
  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1200&q=80",
  "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80",
  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=80",
];

for (const [index, photo] of photos.entries()) {
  await page.fill("#gallery-url", photo);
  await page.fill("#gallery-alt", `Foto ${index + 1} del complejo`);
  await page.getByRole("button", { name: /Agregar foto/i }).click();
  await page.waitForTimeout(1200);
}

// --- services ---------------------------------------------------------------
for (const key of ["estacionamiento", "bar", "parrilla", "wifi", "torneos", "vestuarios", "eventos"]) {
  const box = page.locator(`#service-${key}-enabled`);
  if ((await box.count()) > 0 && !(await box.isChecked())) {
    await box.check();
  }
}
await page.getByRole("button", { name: /Guardar servicios/i }).click();
await page.waitForTimeout(1500);

// --- location ---------------------------------------------------------------
await page.fill("#map-url", "https://www.google.com/maps/@-31.4201,-64.1888,17z");
await page.fill("#map-place", "Complejo Los Sauces");
await page.getByRole("button", { name: /Guardar ubicación/i }).click();
await page.waitForTimeout(1500);

await page.screenshot({ path: `${shots}/settings.png`, fullPage: true });

// --- public page ------------------------------------------------------------
const publicLink = await page.locator("a[href^='/c/']").first().getAttribute("href");
await page.goto(`${base}${publicLink}`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: `${shots}/public-full.png`, fullPage: true });

// The map window
const mapButton = page.getByRole("button", { name: /Ver en el mapa/i });
if ((await mapButton.count()) > 0) {
  await mapButton.click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${shots}/map-window.png` });
}

console.log("public url:", `${base}${publicLink}`);
console.log("console errors:", errors.length);
for (const e of errors.slice(0, 8)) console.log("  !", e);

await browser.close();
