import { chromium } from "@playwright/test";

const url = process.argv[2];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

const info = await page.evaluate(() => {
  const out = [];
  const mesh = document.querySelector(".mesh");
  const layer = document.querySelector(".mesh-layer");
  const grain = document.querySelector(".grain-layer");

  for (const [label, el] of [
    ["mesh", mesh],
    ["mesh-layer", layer],
    ["grain-layer", grain],
  ]) {
    if (!el) {
      out.push([label, "MISSING"]);
      continue;
    }
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    out.push([
      label,
      `x=${Math.round(r.x)} w=${Math.round(r.width)} h=${Math.round(r.height)} bg=${s.backgroundImage.slice(0, 60)} filter=${s.filter} blend=${s.mixBlendMode}`,
    ]);
  }
  out.push(["body w", String(document.body.getBoundingClientRect().width)]);
  out.push(["scroll w", String(document.documentElement.scrollWidth)]);
  return out;
});

console.log(info.map((r) => r.join(" :: ")).join("\n"));
await browser.close();
