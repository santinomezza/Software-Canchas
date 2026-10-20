import { chromium } from "@playwright/test";

const url = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/Argentina/Buenos_Aires",
  });

const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
});
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("WebSocket")) {
    errors.push(m.text().slice(0, 200));
  }
});

await page.goto(url, { waitUntil: "networkidle" });

// 1. Cancha
// Se elige la cancha con disponibilidad: una sin horarios no es clickeable.
await page.locator("button", { hasText: /\d+ horarios/ }).first().click();
await page.waitForTimeout(600);

// 2. Horario
const slot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
await slot.click();
await page.waitForTimeout(600);

// 3. Datos
await page.fill("#pub-name", "ClienteDesdeElTunel");
await page.fill("#pub-email", "cliente@test.com");
await page.fill("#pub-phone", "+5493511122233");
await page.waitForTimeout(300);

// 4. Confirmar
await page.getByRole("button", { name: /Confirmar y pagar/i }).click();
await page.waitForURL(/reserva=|mercadopago\.com|mercadopago\.com\.ar/, { timeout: 30000 });
await page.waitForTimeout(1200);

const finalUrl = page.url();
const confirmed = await page.getByText(/Reserva confirmada/i).count();

console.log("url final:", finalUrl);
console.log(
  "checkout de Mercado Pago:",
  /mercadopago/.test(finalUrl) ? "sí (redirigió al checkout)" : "no",
);
console.log("confirmación visible:", confirmed > 0);
console.log("errores de consola:", errors.length);
for (const e of errors.slice(0, 5)) console.log("  !", e);

await browser.close();
