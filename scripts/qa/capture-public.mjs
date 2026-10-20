/**
 * Sets up a demo complex with courts, hours and bookings, then captures the
 * public page that customers see.
 *
 * Usage: node scripts/qa/capture-public.mjs [baseUrl]
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const shots = "C:/Users/santi/AppData/Local/Temp/kilo/public";
fs.mkdirSync(shots, { recursive: true });

const stamp = Date.now();
const owner = `demo${stamp}@test.com`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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

await page.fill("#name", "Complejo Los Sauces");
await page.fill("#address", "Av. Costanera 1420");
await page.fill("#city", "Córdoba");
for (const sport of ["padel", "tenis"]) {
  await page.check(`input[name="sports"][value="${sport}"]`);
}
await page.getByRole("button", { name: /^Guardar cambios/i }).click();
await page.waitForTimeout(1500);

const courts = [
  ["Pádel Norte", "padel", 22000, 90, 50],
  ["Pádel Sur", "padel", 22000, 90, 50],
  ["Tenis 1", "tenis", 18000, 60, 50],
  ["Tenis 2", "tenis", 18000, 60, 50],
];

for (const [name, sport, price, duration, deposit] of courts) {
  await page.goto(`${base}/panel/canchas`, { waitUntil: "networkidle" });
  await page.fill("#court-name", name);
  await page.selectOption("#court-sport", sport);
  await page.fill("#court-price", String(price));
  await page.fill("#court-duration", String(duration));
  await page.fill("#court-deposit", String(deposit));
  await page.getByRole("button", { name: /Agregar cancha/i }).click();
  await page.waitForTimeout(1200);
}

await page.goto(`${base}/panel/horarios`, { waitUntil: "networkidle" });
for (let day = 0; day < 7; day += 1) await page.uncheck(`#day-${day}-closed`);
await page.fill("#day-1-open", "09:00");
await page.fill("#day-1-close", "22:00");
await page.getByRole("button", { name: /^Guardar cambios/i }).click();
await page.waitForTimeout(1500);

// A few bookings so the grid shows both states.
const people = [
  ["María Gómez", "19:00", "Pádel Norte"],
  ["Sebastián Vidal", "17:30", "Pádel Sur"],
  ["Axel Podestá", "11:00", "Tenis 1"],
];

for (const [player, time, courtName] of people) {
  await page.goto(`${base}/panel/agenda`, { waitUntil: "networkidle" });
  const courtLink = page.locator(`a:has-text("${courtName}")`).first();
  if ((await courtLink.count()) > 0) {
    await courtLink.click();
    await page.waitForLoadState("networkidle");
  }
  const slot = page.locator(`input[name="start"][value="${time}"]`).first();
  if ((await slot.count()) > 0) {
    await slot.click({ force: true });
    await page.fill("#be-player", player);
    await page.fill("#be-email", `${player.split(" ")[0].toLowerCase()}@test.com`);
    await page.selectOption("#be-method", "efectivo");
    await page.getByRole("button", { name: /^Crear turno/i }).click();
    await page.waitForTimeout(1800);
  }
}

// --- capture the public page ------------------------------------------------
const publicLink = await page
  .locator("a[href^='/c/']")
  .first()
  .getAttribute("href");

await page.goto(`${base}${publicLink}`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.screenshot({ path: `${shots}/public-top.png` });
await page.screenshot({ path: `${shots}/public-full.png`, fullPage: true });

// The new design selects a court with a button, then a time slot.
const courtButton = page.getByRole("button", { name: /Pádel Norte/ }).first();
if ((await courtButton.count()) > 0) {
  await courtButton.click();
  await page.waitForTimeout(600);
  const slot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
  if ((await slot.count()) > 0) await slot.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${shots}/public-court.png` });
  await page.screenshot({ path: `${shots}/public-court-full.png`, fullPage: true });
}

// Mobile
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mpage = await mobile.newPage();
await mpage.goto(`${base}${publicLink}`, { waitUntil: "networkidle" });
await mpage.waitForTimeout(600);
await mpage.screenshot({ path: `${shots}/public-mobile.png`, fullPage: true });

console.log("public url:", `${base}${publicLink}`);
console.log("console errors:", errors.length);
for (const e of errors.slice(0, 8)) console.log("  !", e);

await browser.close();
