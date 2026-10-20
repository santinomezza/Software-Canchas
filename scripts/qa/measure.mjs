import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

const info = await page.evaluate(() => {
  const out = [];
  const push = (label, el) => {
    if (!el) return out.push([label, "MISSING"]);
    const r = el.getBoundingClientRect();
    out.push([label, `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`]);
  };

  const mock = document.querySelector(".rounded-\\[var\\(--radius-lg\\)\\].border.border-line-strong");
  push("mockup", mock);
  push("mockup-children", mock?.lastElementChild);
  const main = mock?.querySelector(".grid.grid-cols-\\[clamp\\(28px\\,4vw\\,52px\\)_1fr\\]");
  push("grid", main);
  const chart = mock?.querySelector(".mt-2\\.5");
  push("chart", chart);
  push("chart-title", mock?.querySelector("p.mt-2\\.5")?.parentElement?.querySelector("p"));
  const bars = mock?.querySelectorAll(".mt-1\\.5.flex.h-12 > span");
  push("bars", bars?.[0]);
  out.push(["bar-count", String(bars?.length ?? 0)]);
  out.push(["mockup-html-class", mock?.className ?? ""]);
  return out;
});

console.log(info.map((r) => r.join(" :: ")).join("\n"));
await browser.close();
