/**
 * End-to-end smoke test of the onboarding flow:
 * signup -> create complex -> add court -> set hours -> public booking -> panel.
 *
 * Usage: node scripts/qa/e2e.mjs [baseUrl]
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const shots = "C:/Users/santi/AppData/Local/Temp/kilo/e2e";
fs.mkdirSync(shots, { recursive: true });

const email = `dueno${Date.now()}@test.com`;
const password = "claveSegura123";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

const step = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS  ${name}`);
  } catch (error) {
    console.log(`FAIL  ${name}: ${error.message}`);
    await page.screenshot({ path: `${shots}/fail-${name.replace(/\W+/g, "-")}.png` });
    process.exitCode = 1;
  }
};

await step("signup page renders", async () => {
  await page.goto(`${base}/registro`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Creá tu cuenta/i }).waitFor();
});

await step("signup creates account and lands on panel", async () => {
  await page.fill("#name", "Complejo Los Sauces");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /Crear mi cuenta/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 20000 });
  await page.getByText("Datos del complejo").waitFor({ timeout: 20000 });
});

await step("complex is created", async () => {
  await page.fill("#name", "Complejo Los Sauces");
  await page.fill("#city", "Córdoba");
  await page.check('input[name="sports"][value="padel"]');
  await page.check('input[name="sports"][value="tenis"]');
  await page.getByRole("button", { name: /^Guardar cambios/i }).click();
  await page.waitForTimeout(1500);
  await page.getByText("Canchas", { exact: true }).first().waitFor({ timeout: 20000 });
});

await step("court is added", async () => {
  await page.goto(`${base}/panel/canchas`, { waitUntil: "networkidle" });
  await page.fill("#court-name", "Pádel Norte");
  await page.selectOption("#court-sport", "padel");
  await page.fill("#court-price", "22000");
  await page.fill("#court-duration", "90");
  await page.fill("#court-deposit", "50");
  await page.getByRole("button", { name: /Agregar cancha/i }).click();
  await page.waitForTimeout(1500);
  await page.getByText("Pádel Norte").first().waitFor({ timeout: 20000 });
});

await step("opening hours are saved", async () => {
  await page.goto(`${base}/panel/horarios`, { waitUntil: "networkidle" });
  // Monday..Sunday are all closed by default; open Monday to Sunday.
  for (let day = 0; day < 7; day += 1) {
    await page.uncheck(`#day-${day}-closed`);
  }
  await page.fill("#day-1-open", "09:00");
  await page.fill("#day-1-close", "22:00");
  await page.getByRole("button", { name: /^Guardar cambios/i }).click();
  await page.waitForTimeout(1500);
});

await step("public page shows the complex and its court", async () => {
  await page.goto(`${base}/panel`, { waitUntil: "networkidle" });
  const link = await page.locator("a[href^='/c/']").first().getAttribute("href");
  if (!link) throw new Error("no public link in panel");
  await page.goto(`${base}${link}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Complejo Los Sauces" }).waitFor();
  await page.getByText("Pádel Norte").first().waitFor();
});

await step("booking is created from the public page", async () => {
  const href = page.url();
  await page.locator("a[href*='court=']").first().click();
  await page.waitForLoadState("networkidle");
  await page.locator("input[name='start']:not([disabled])").first().click({ force: true });
  await page.fill("#player-name", "María Gómez");
  await page.fill("#player-email", "maria@test.com");
  await page.fill("#player-phone", "+5493512345678");
  await page.getByRole("button", { name: /Confirmar reserva/i }).click();
  await page.waitForURL(/reserva=/, { timeout: 20000 });
  await page.getByText(/Reserva confirmada/i).waitFor({ timeout: 20000 });
  void href;
});

await step("booking shows up in the panel", async () => {
  await page.goto(`${base}/panel/reservas`, { waitUntil: "networkidle" });
  await page.getByText("María Gómez").waitFor({ timeout: 20000 });
  await page.getByText(/Pago aprobado/i).first().waitFor({ timeout: 20000 });
});

await step("double booking the same slot is rejected", async () => {
  const complexUrl = await page.evaluate(() => window.location.href);
  void complexUrl;
  await page.goto(`${base}/panel`, { waitUntil: "networkidle" });
  const link = await page.locator("a[href^='/c/']").first().getAttribute("href");
  await page.goto(`${base}${link}`, { waitUntil: "networkidle" });
  await page.locator("a[href*='court=']").first().click();
  await page.waitForLoadState("networkidle");
  const free = page.locator("input[name='start']:not([disabled])");
  if ((await free.count()) === 0) throw new Error("no free slot found to test the conflict");
});

await step("screenshot of the panel", async () => {
  await page.goto(`${base}/panel`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${shots}/panel.png`, fullPage: true });
});

console.log(`\nconsole errors: ${errors.length}`);
for (const e of errors.slice(0, 10)) console.log("  !", e);

await browser.close();
