// Renders one comparison strip per style into mocks/.  node tools/build-mocks.mjs
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const root = new URL("..", import.meta.url).pathname;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = createServer(async (req, res) => {
  const path = join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  try { res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" }); res.end(await readFile(path)); }
  catch { res.writeHead(404).end(); }
}).listen(0);
await mkdir(join(root, "mocks"), { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const style of ["realistic", "toon", "ink", "lowpoly", "pastel"]) {
  const page = await browser.newPage({ viewport: { width: 1500, height: 440 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://localhost:${server.address().port}/tools/mocks.html?style=${style}`, { waitUntil: "networkidle" });
  await page.waitForSelector("body[data-ready]");
  await page.screenshot({ path: join(root, "mocks", `${style}.png`), fullPage: true });
  console.log(style, errors.length ? errors : "ok");
  await page.close();
}
await browser.close();
server.close();
