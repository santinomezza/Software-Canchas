import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(process.argv[2] ?? "http://localhost:3000", { waitUntil: "networkidle" });
await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });

const result = await page.evaluate(async () => {
  const r = await window.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  });
  return r.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => ({ target: n.target, html: n.html.slice(0, 220) })),
  }));
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
