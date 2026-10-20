import { chromium } from "@playwright/test";

const url = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/Argentina/Buenos_Aires",
  });

page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const before = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll("button")).filter((b) =>
    /BOMBONERA|CILINDRO|MONUMENTAL/.test(b.textContent ?? ""),
  );
  return cards.map((c) => c.textContent?.replace(/\s+/g, " ").trim());
});
console.log("tarjetas de cancha:", JSON.stringify(before));

const target = process.argv[3] ?? "CILINDRO";
await page.getByRole("button", { name: new RegExp(target) }).first().click();
await page.waitForTimeout(1200);

const after = await page.evaluate(() => {
  const h2 = Array.from(document.querySelectorAll("h2")).find((h) =>
    /horario/i.test(h.textContent ?? ""),
  );
  const section = h2?.closest("section");
  const all = Array.from(document.querySelectorAll("button, span"));
  const slots = all
    .map((b) => ({ tag: b.tagName, text: b.textContent?.trim() ?? "" }))
    .filter((s) => /^\d{2}:\d{2}$/.test(s.text));
  const buttons = slots.filter((s) => s.tag === "BUTTON");

  return {
    found: !!section,
    sectionText: section?.textContent?.replace(/\s+/g, " ").slice(0, 300),
    slotCount: slots.length,
    buttons: buttons.length,
    spans: slots.filter((s) => s.tag === "SPAN").length,
    buttonHtml: buttons
      .slice(0, 2)
      .map((b) => {
        const el = all.find((x) => x.tagName === b.tag && x.textContent?.trim() === b.text);
        return el?.outerHTML?.slice(0, 260);
      }),
    firstSlots: slots.slice(0, 4).map((s) => `${s.tag}:${s.text}`),
    noSlotsMessage: document.body.innerText.includes("No hay horarios"),
  };
});
console.log("sección encontrada:", after.found);
console.log("texto de la sección:", after.sectionText);
console.log(
  "horarios:",
  after.slotCount,
  "| botones (disponibles):",
  after.buttons,
  "| tachados (ocupados):",
  after.spans,
);
console.log("html de los botones:", JSON.stringify(after.buttonHtml, null, 2));
console.log("mensaje de sin horarios:", after.noSlotsMessage);

console.log("\n--- conteos desde Playwright ---");
console.log("botones por rol:", await page.getByRole("button").count());
console.log('por rol + nombre "20:00":', await page.getByRole("button", { name: "20:00" }).count());
console.log("por rol + regex:", await page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).count());
console.log("por texto:", await page.getByText("20:00", { exact: true }).count());
console.log("por texto exact:", await page.getByText("20:00").count());

await browser.close();
