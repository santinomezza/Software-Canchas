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
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
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
  const employeeContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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

console.log(`\nconsole errors: ${errors.length}`);
for (const e of errors.slice(0, 10)) console.log("  !", e.replace(/%c[^%]*%c/g, ""));

await browser.close();
