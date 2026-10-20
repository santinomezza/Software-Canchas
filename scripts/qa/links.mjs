import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(process.argv[2] ?? "http://localhost:3000", { waitUntil: "networkidle" });

const links = await page.evaluate(() =>
  Array.from(document.querySelectorAll("link[rel]")).map((l) => ({
    rel: l.getAttribute("rel"),
    hreflang: l.getAttribute("hreflang"),
    raw: l.getAttribute("href"),
    resolved: l.href,
  })),
);

console.log(JSON.stringify(links.filter((l) => l.rel === "canonical" || l.rel === "alternate"), null, 2));
await browser.close();
