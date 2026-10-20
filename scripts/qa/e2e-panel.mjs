/**
 * End-to-end test of the new panel features:
 * agenda (create + edit booking), cash report, employees and roles.
 *
 * Usage: node scripts/qa/e2e-panel.mjs [baseUrl]
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const shots = "C:/Users/santi/AppData/Local/Temp/kilo/e2e-panel";
fs.mkdirSync(shots, { recursive: true });

const stamp = Date.now();
const owner = `dueno${stamp}@test.com`;
let tempPassword = "";
const employee = `encargado${stamp}@test.com`;
const password = "claveSegura123";

const browser = await chromium.launch();
const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    timezoneId: "America/Argentina/Buenos_Aires",
  });
const page = await context.newPage();

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

const step = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS  ${name}`);
  } catch (error) {
    console.log(`FAIL  ${name}: ${error.message.split("\n")[0]}`);
    await page.screenshot({ path: `${shots}/fail-${name.replace(/\W+/g, "-")}.png` });
    process.exitCode = 1;
  }
};

await step("owner signs up and sets up the complex", async () => {
  await page.goto(`${base}/registro`, { waitUntil: "networkidle" });
  await page.fill("#name", "Complejo Los Sauces");
  await page.fill("#email", owner);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /Crear mi cuenta/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 20000 });

  await page.fill("#name", "Complejo Los Sauces");
  await page.check('input[name="sports"][value="padel"]');
  await page.getByRole("button", { name: /^Guardar cambios/i }).click();
  await page.waitForTimeout(1200);

  await page.goto(`${base}/panel/canchas`, { waitUntil: "networkidle" });
  await page.fill("#court-name", "Pádel Norte");
  await page.fill("#court-price", "22000");
  await page.fill("#court-duration", "90");
  await page.fill("#court-deposit", "50");
  await page.getByRole("button", { name: /Agregar cancha/i }).click();
  await page.waitForTimeout(1200);

  await page.goto(`${base}/panel/horarios`, { waitUntil: "networkidle" });
  for (let day = 0; day < 7; day += 1) await page.uncheck(`#day-${day}-closed`);
  await page.getByRole("button", { name: /^Guardar cambios/i }).click();
  await page.waitForTimeout(1200);
});

await step("agenda renders the grid with the court column", async () => {
  await page.goto(`${base}/panel/agenda`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /turnos del día/i }).waitFor({ timeout: 20000 });
  await page.getByText("Pádel Norte").first().waitFor();
  await page.screenshot({ path: `${shots}/agenda.png` });
});

await step("booking is created from an empty slot", async () => {
  await page.locator("button[aria-label*='Nuevo turno']").first().click();
  await page.getByRole("dialog").waitFor({ timeout: 10000 });
  await page.fill("#be-player", "María Gómez");
  await page.fill("#be-email", "maria@test.com");
  await page.fill("#be-phone", "+5493512345678");
  await page.selectOption("#be-method", "efectivo");
  await page.getByRole("button", { name: /^Crear turno/i }).click();
  await page.waitForTimeout(2000);
  await page.getByText("María Gómez").first().waitFor({ timeout: 20000 });
});

await step("booking is fully editable from the agenda", async () => {
  await page.getByRole("button", { name: /María Gómez/ }).first().click();
  await page.getByRole("dialog").waitFor({ timeout: 10000 });
  await page.fill("#be-player", "María Gómez Edited");
  await page.fill("#be-amount", "31000");
  await page.selectOption("#be-method", "debito");
  await page.getByRole("button", { name: /^Guardar cambios/i }).click();
  await page.waitForTimeout(2000);
  await page.getByText("María Gómez Edited").first().waitFor({ timeout: 20000 });
});

await step("cash report lists the movement and totals", async () => {
  await page.goto(`${base}/panel/caja`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Reporte de caja/i }).waitFor({ timeout: 20000 });
  await page.getByText(/Cobra (Seña|Turno)/).first().waitFor({ timeout: 20000 });
  await page.getByText("Totales por medio de pago").waitFor();
  await page.screenshot({ path: `${shots}/caja.png` });
});

await step("manual cash movement is registered", async () => {
  await page.getByRole("button", { name: /Registrar movimiento/i }).click();
  await page.fill("#cm-concept", "Consumo bar");
  await page.fill("#cm-amount", "4500");
  await page.getByRole("button", { name: /^Guardar$/ }).click();
  await page.waitForTimeout(2000);
  await page.getByText("Consumo bar").first().waitFor({ timeout: 20000 });
});

await step("employee is added with a temporary password", async () => {
  await page.goto(`${base}/panel/empleados`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Empleados y permisos/i }).waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: /Agregar empleado/i }).click();
  await page.fill("#tm-name", "Julián Soto");
  await page.fill("#tm-email", employee);
  await page.selectOption("#tm-role", "encargado");
  await page.getByRole("button", { name: /^Agregar empleado/i }).click();
  await page.waitForTimeout(2000);
  await page.getByText("Julián Soto").first().waitFor({ timeout: 20000 });
  await page.getByText(/Contraseña temporal/i).waitFor({ timeout: 10000 });
  tempPassword = (await page.locator("code").first().textContent())?.trim() ?? "";
  console.log("   temp password:", JSON.stringify(tempPassword));
  await page.screenshot({ path: `${shots}/equipo.png` });
});

await step("employee signs in and sees a read-only agenda", async () => {
  const employeeContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/Argentina/Buenos_Aires",
  });
  const employeePage = await employeeContext.newPage();

  await employeePage.goto(`${base}/acceder`, { waitUntil: "networkidle" });
  await employeePage.fill("#email", employee);
  await employeePage.fill("#password", tempPassword);

  await employeePage.getByRole("button", { name: /^Entrar$/i }).click();
  await employeePage.waitForURL(/\/panel\/mi-cuenta/, { timeout: 20000 });
  await employeePage.waitForTimeout(1000);
  console.log("   employee url:", employeePage.url());

  // The first login forces the employee to replace the temporary password.
  await employeePage
    .getByRole("heading", { name: /Elegí tu contraseña/i })
    .waitFor({ timeout: 20000 });
  await employeePage.fill("#current-password", tempPassword);
  await employeePage.fill("#next-password", "nuevaClaveSegura456");
  await employeePage.fill("#confirm-password", "nuevaClaveSegura456");
  await employeePage.getByRole("button", { name: /Cambiar contraseña/i }).click();
  await employeePage.waitForURL(/\/panel(\?|$)/, { timeout: 20000 });
  await employeePage.waitForTimeout(1000);

  // Now the agenda of the complex is reachable.
  await employeePage.goto(`${base}/panel/agenda`, { waitUntil: "networkidle" });
  await employeePage.getByRole("heading", { name: /turnos del día/i }).waitFor({ timeout: 20000 });
  await employeePage.getByText("Pádel Norte").first().waitFor({ timeout: 20000 });

  // The cash report is readable...
  await employeePage.goto(`${base}/panel/caja`, { waitUntil: "networkidle" });
  await employeePage.getByRole("heading", { name: /Reporte de caja/i }).waitFor({ timeout: 20000 });

  // ...but the team section is not: the role does not have `team.read`.
  await employeePage.goto(`${base}/panel/empleados`, { waitUntil: "networkidle" });
  await employeePage.waitForURL(/\/panel(?!\/empleados)/, { timeout: 20000 });
  await employeePage.getByRole("heading", { name: /Empleados y permisos/i }).count().then((n) => {
    if (n !== 0) throw new Error("the encargado should not see the team section");
  });

  await employeeContext.close();
});

await step("integrations can be configured from the complex settings", async () => {
  await page.goto(`${base}/panel/configuracion`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Integraciones/i }).waitFor({ timeout: 20000 });
  await page.getByText("Mercado Pago").first().waitFor({ timeout: 10000 });
  await page.getByText("WhatsApp").first().waitFor({ timeout: 10000 });
  await page.screenshot({ path: `${shots}/integraciones.png` });

  // An invalid token must be rejected by the server-side validation.
  await page.fill("#mp-token", "APP_USR-invalido-invalido-invalido");
  await page.getByRole("button", { name: /Conectar Mercado Pago/i }).click();
  await page.waitForTimeout(2500);
  await page.getByText(/rechazó el token|No se pudo contacting/i).first().waitFor({ timeout: 20000 });
});


await step("booking is cancelled with a custom message and reason", async () => {
  await page.goto(`${base}/panel/agenda`, { waitUntil: "networkidle" });

  // Open the first booking of the day and cancel it.
  const block = page.getByRole("button", { name: /María Gómez Edited/ }).first();
  if ((await block.count()) === 0) throw new Error("no booking to cancel");
  await block.click();
  await page.getByRole("dialog").waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: /Cancelar este turno/i }).click();

  const cancelDialog = page.getByRole("dialog").filter({ hasText: /Cancelar el turno/i });
  await cancelDialog.waitFor({ timeout: 10000 });

  // The default message is prefilled and can be personalised.
  const message = cancelDialog.locator("#cancel-message");
  const defaultValue = await message.inputValue();
  if (!/cancelado/i.test(defaultValue)) {
    throw new Error(`unexpected default message: ${defaultValue}`);
  }
  await message.fill("Tu turno fue cancelado por mantenimiento de la cancha");

  // The reason is optional and revealed by the checkbox.
  await cancelDialog.getByRole("checkbox").check();
  await cancelDialog.locator("#cancel-reason").fill("Mantenimiento programado");

  await cancelDialog.getByRole("button", { name: /^Cancelar el turno$/i }).click();
  await page.waitForTimeout(2500);

  await page.getByText(/Turnos cancelados/i).first().waitFor({ timeout: 20000 });
  await page.getByText(/María Gómez Edited/).first().waitFor({ timeout: 20000 });
});

await step("gallery, services and location are configurable", async () => {
  await page.goto(`${base}/panel/configuracion`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Galería de fotos/i }).waitFor({ timeout: 20000 });
  await page.getByRole("heading", { name: /Servicios que ofrecés/i }).waitFor({ timeout: 20000 });
  await page.getByRole("heading", { name: /Ubicación/i }).waitFor({ timeout: 20000 });

  // A gallery image by URL.
  await page.getByRole("button", { name: /Pegar URL/i }).click();
  await page.fill("#gallery-url", "https://example.com/foto-cancha.jpg");
  await page.fill("#gallery-alt", "Cancha principal");
  await page.getByRole("button", { name: /Agregar foto/i }).click();
  await page.waitForTimeout(1800);
  await page.getByAltText("Cancha principal").waitFor({ timeout: 20000 });

  // Services: enable one that was off.
  const duchas = page.locator("#service-duchas-enabled");
  if ((await duchas.count()) > 0 && !(await duchas.isChecked())) {
    await duchas.check();
  }
  await page.getByRole("button", { name: /Guardar servicios/i }).click();
  await page.waitForTimeout(1800);

  // Location: the coordinates are parsed from the Maps link.
  await page.fill("#map-url", "https://www.google.com/maps/@-31.4201,-64.1888,17z");
  await page.fill("#map-place", "Complejo Los Sauces");
  await page.getByRole("button", { name: /Guardar ubicación/i }).click();
  await page.waitForTimeout(1800);
  await page.getByText(/Ubicación configurada/i).waitFor({ timeout: 20000 });
});

await step("the public page shows the gallery, services and map", async () => {
  const link = await page.locator("a[href^='/c/']").first().getAttribute("href");
  await page.goto(`${base}${link}`, { waitUntil: "networkidle" });

  await page.getByRole("heading", { name: /Conocé nuestras canchas/i }).waitFor({ timeout: 20000 });
  await page.getByRole("heading", { name: /Todo lo que necesitás/i }).waitFor({ timeout: 20000 });
  await page.getByText("Duchas").first().waitFor({ timeout: 20000 });

  // The map opens in a window.
  await page.getByRole("button", { name: /Ver en el mapa/i }).click();
  await page.waitForTimeout(1500);
  const frame = page.locator("iframe");
  await frame.waitFor({ timeout: 20000 });
  const src = await frame.getAttribute("src");
  if (!src || !src.includes("google.com/maps")) {
    throw new Error(`unexpected map src: ${src}`);
  }
});

console.log(`\nconsole errors: ${errors.length}`);
for (const e of errors.slice(0, 10)) console.log("  !", e.replace(/%c[^%]*%c/g, ""));

await browser.close();
