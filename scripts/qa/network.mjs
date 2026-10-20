import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const bad = [];
page.on("response", (r) => {
  if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
});
await page.goto(process.argv[2] ?? "http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
console.log(bad.length ? bad.join("\n") : "no failing requests");
await browser.close();
