import { chromium } from "@playwright/test";

const base = "http://localhost:3000";
const { DatabaseSync } = await import("node:sqlite");
const db = new DatabaseSync("./data/cancha.db");
const row = db.prepare("SELECT slug FROM complexes ORDER BY id DESC LIMIT 1").get();
const url = `${base}/c/${row.slug}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll("button"));
  const target = buttons.find((b) => /Ver en el mapa/i.test(b.textContent ?? ""));
  if (!target) return { found: false, count: buttons.length };

  const r = target.getBoundingClientRect();
  const style = getComputedStyle(target);
  const ancestors = [];
  let el = target.parentElement;
  for (let i = 0; i < 4 && el; i += 1) {
    const s = getComputedStyle(el);
    ancestors.push(`${el.tagName}.${el.className.slice(0, 40)} :: ${s.display} ${s.visibility} ${s.opacity} h=${Math.round(el.getBoundingClientRect().height)}`);
    el = el.parentElement;
  }

  return {
    found: true,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
    ancestors,
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
