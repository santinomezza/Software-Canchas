import { chromium } from "@playwright/test";

const url = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 500)));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("WebSocket")) {
    console.log("[console.error]", m.text().slice(0, 400));
  }
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// ¿React hidrató? Los nodos de React llevan claves __reactProps$...
const hydrated = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll("button"));
  const withReact = buttons.filter((b) =>
    Object.keys(b).some((k) => k.startsWith("__reactProps")),
  ).length;
  return { total: buttons.length, withReact };
});
console.log("botones:", hydrated.total, "| con props de React (hidratados):", hydrated.withReact);

// Click en una cancha
const court = page.getByRole("button", { name: /BOMBONERA|CILINDRO/ }).first();
await court.click();
await page.waitForTimeout(1500);

const state = await page.evaluate(() => {
  const steps = Array.from(document.querySelectorAll("h2"));
  return steps.map((h) => h.textContent?.trim()).filter(Boolean);
});
console.log("pasos visibles:", JSON.stringify(state));

const section = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll("h2")).find((h) =>
    /horario/i.test(h.textContent ?? ""),
  );
  return el?.parentElement?.textContent?.replace(/\s+/g, " ").slice(0, 400) ?? "(sin sección de horarios)";
});
console.log("sección horarios:", section);

const slots = await page.evaluate(() =>
  Array.from(document.querySelectorAll("button"))
    .map((b) => b.textContent?.trim())
    .filter((t) => /^\d{2}:\d{2}$/.test(t ?? "")),
);
console.log("botones de horario:", JSON.stringify(slots));

await browser.close();
