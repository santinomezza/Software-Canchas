/**
 * Lighthouse audit + axe accessibility scan.
 *
 * Usage: node scripts/qa/lighthouse.mjs [baseUrl]
 * Requires a running server. Uses the Playwright Chromium binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const outDir = "qa/lighthouse";
fs.mkdirSync(outDir, { recursive: true });

const chrome = chromium.executablePath();

function runLighthouse(url, flags = []) {
  return new Promise((resolve, reject) => {
    const args = [
      url,
      "--output=json",
      `--output-path=${outDir}/report.json`,
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--quiet",
      ...flags,
    ];
    const child = spawn(
      process.execPath,
      ["node_modules/lighthouse/cli/index.js", ...args],
      {
        env: { ...process.env, CHROME_PATH: chrome },
        stdio: ["ignore", "ignore", "pipe"],
      },
    );
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(stderr.slice(-1200))),
    );
  });
}

console.log("Running Lighthouse (mobile emulation)…");
await runLighthouse(base);
console.log("Running Lighthouse (desktop emulation)…");
await runLighthouse(base, ["--preset=desktop"]);

const report = JSON.parse(fs.readFileSync(`${outDir}/report.json`, "utf8"));

const rows = Object.entries(report.categories)
  .map(([key, value]) => [key, Math.round((value.score ?? 0) * 100)])
  .sort((a, b) => a[0].localeCompare(b[0]));

console.log("\nLighthouse scores");
for (const [name, score] of rows) {
  console.log(`  ${name.padEnd(16)} ${score}`);
}

const metrics = report.audits;
console.log("\nCore metrics");
for (const id of [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
]) {
  const audit = metrics[id];
  if (audit) console.log(`  ${id.padEnd(28)} ${audit.displayValue}`);
}

// axe-core scan on the live page
console.log("\naxe-core accessibility scan…");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(base, { waitUntil: "networkidle" });
await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
const axe = await page.evaluate(async () => {
  const result = await window.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  });
  return result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    target: v.nodes[0]?.target?.join(" "),
  }));
});
await browser.close();

if (axe.length === 0) {
  console.log("  no violations found");
} else {
  console.log(`  ${axe.length} violation type(s):`);
  for (const v of axe) {
    console.log(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes} node(s)) ${v.target ?? ""}`);
  }
}

fs.writeFileSync(`${outDir}/axe.json`, JSON.stringify(axe, null, 2));
console.log(`\nReport written to ${outDir}/report.json`);
