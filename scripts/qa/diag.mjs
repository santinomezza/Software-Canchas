import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

await page.locator("#panel").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const out = [];
  const panel = document.querySelector("#panel");
  const cards = panel.querySelectorAll(".rounded-\\[var\\(--radius-lg\\)\\]");
  out.push(["cards found", String(cards.length)]);

  panel.querySelectorAll("div").forEach((el, i) => {
    const style = getComputedStyle(el);
    if (style.opacity !== "1") {
      const r = el.getBoundingClientRect();
      out.push([
        `invisible div #${i}`,
        `opacity=${style.opacity} transform=${style.transform} rect=${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} cls=${el.className.slice(0, 60)}`,
      ]);
    }
  });

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  out.push(["prefers-reduced-motion", String(reduced)]);

  const first = panel.querySelector(".mt-10");
  if (first) {
    const r = first.getBoundingClientRect();
    const s = getComputedStyle(first);
    out.push(["stagger container", `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} opacity=${s.opacity} children=${first.children.length}`]);
  }
  return out;
});

console.log(info.map((r) => r.join(" :: ")).join("\n"));
await browser.close();
