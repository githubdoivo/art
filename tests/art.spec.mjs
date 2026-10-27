import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const lang of ["en", "pt"]) {
  test(`${lang}: the sketchbook renders every section, with no errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/?lang=${lang}`);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("h1")).toHaveText(lang === "pt" ? "Cerâmica" : "Ceramics");
    await expect(page.locator("#steps .card")).toHaveCount(5);
    await expect(page.locator("#prints .print")).toHaveCount(6);
    await expect(page.locator(".order a[href^='mailto:']")).toHaveAttribute("href", "mailto:mail@ivolopes.com");
    // Every image the page shows actually loads.
    await page.evaluate(() => Promise.all([...document.images].map((i) => { i.loading = "eager"; return i.decode().catch(() => null); })));
    const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
    expect(broken).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("every piece photo has a description for screen readers", async ({ page }) => {
  await page.goto("/?lang=en");
  for (const img of await page.locator("#prints img.piece").all()) expect((await img.getAttribute("alt")).length).toBeGreaterThan(20);
});

test("switching language keeps the visitor's choice", async ({ page }) => {
  await page.goto("/?lang=en");
  await page.locator("#lang-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
});

test("nothing scrolls sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ["/?lang=pt", "/?lang=en"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
});

test("no serious accessibility problems", async ({ page }) => {
  await page.goto("/?lang=en");
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

/* ---------- Order form ---------- */
// Stand-ins for Turnstile and the order Worker, so tests never send real email.
async function fakeServices(page, reply = { status: 201, body: { ok: true, id: "ORD-261013-TEST" } }) {
  const sent = [];
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js*", (route) => route.fulfill({
    contentType: "text/javascript",
    body: "window.turnstile={render:(el,o)=>{setTimeout(()=>o.callback('test-token'),10);return 'w'},reset:()=>{}};window.__onTurnstile&&window.__onTurnstile();",
  }));
  await page.route("https://orders.ivolopes.com/orders", async (route) => {
    sent.push(route.request().postDataBuffer()?.toString("latin1") || "");
    await route.fulfill({ status: reply.status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(reply.body) });
  });
  return sent;
}
// A tiny valid PNG, as a "photo".
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

async function openOrder(page, lang = "en") {
  await page.goto(`/order/?lang=${lang}`);
  await expect(page.locator("#order-form")).toBeVisible();
}

test("ordering a piece: the request goes out with every field and the photo, and the reference comes back", async ({ page }) => {
  const sent = await fakeServices(page);
  await openOrder(page);
  await page.fill("input[name=name]", "Ana Silva");
  await page.fill("input[name=email]", "ana@example.com");
  await page.fill("textarea[name=description]", "A tall jar with a blue glaze, for my kitchen.");
  await page.setInputFiles("#order-photos", { name: "jar.png", mimeType: "image/png", buffer: PNG });
  await expect(page.locator("#order-previews img")).toHaveCount(1);
  await page.check("input[name=consent]");
  await page.click("#order-send");
  await expect(page.locator("#order-status")).toContainText("ORD-261013-TEST");
  expect(sent).toHaveLength(1);
  for (const part of ["Ana Silva", "ana@example.com", "blue glaze", "test-token", 'name="photos"', 'name="lang"']) {
    expect(sent[0], `the request should include ${part}`).toContain(part);
  }
  await expect(page.locator("input[name=name]")).toHaveValue("");
});

test("missing details are caught before anything is sent", async ({ page }) => {
  const sent = await fakeServices(page);
  await openOrder(page);
  await page.click("#order-send");
  await expect(page.locator("#order-status")).toHaveText("Please add your name.");
  await page.fill("input[name=name]", "Ana");
  await page.fill("input[name=email]", "ana@example.com");
  await page.fill("textarea[name=description]", "A tall jar with a blue glaze.");
  await page.click("#order-send");
  await expect(page.locator("#order-status")).toHaveText("Add between 1 and 3 photos.");
  expect(sent).toHaveLength(0);
});

test("the server's answer is shown in the visitor's language", async ({ page }) => {
  await fakeServices(page, { status: 429, body: { error: "too_many" } });
  await openOrder(page, "pt");
  await page.fill("input[name=name]", "Ana");
  await page.fill("input[name=email]", "ana@example.com");
  await page.fill("textarea[name=description]", "Um jarro alto com vidrado azul.");
  await page.setInputFiles("#order-photos", { name: "jar.png", mimeType: "image/png", buffer: PNG });
  await page.check("input[name=consent]");
  await page.click("#order-send");
  await expect(page.locator("#order-status")).toHaveText("Demasiados pedidos a partir daqui na última hora. Tenta mais tarde.");
});

test("the main page invites to order, and the button opens /order in the same language", async ({ page }) => {
  await page.goto("/?lang=pt");
  const cta = page.locator("#order-cta");
  await cta.scrollIntoViewIfNeeded();
  await expect(cta).toHaveText("Encomendar uma peça");
  await cta.click();
  await expect(page).toHaveURL(/\/order\/\?lang=pt$/);
  await expect(page.locator("h1")).toHaveText("Encomendar uma peça");
});

test("the order page shows the finished jar beside the form, with no errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/order/?lang=en");
  await expect(page).toHaveTitle("Order a piece · Ivo Lopes");
  await expect.poll(() => page.locator("#clay").evaluate((c) => c.dataset.stage)).toBe("7.00");
  await expect(page.locator("#back-link")).toHaveAttribute("href", "/?lang=en");
  expect(errors).toEqual([]);
});

test("the header has no menu: only the language switch", async ({ page }) => {
  await page.goto("/?lang=en");
  await expect(page.locator("header a")).toHaveCount(0);
  await expect(page.locator("header button")).toHaveCount(1);
  await expect(page.locator("#lang-toggle")).toHaveText("PT");
});

test("the header painting and every image load", async ({ page, request }) => {
  await page.goto("/?lang=en");
  for (const f of ["/book/header.webp", "/book/header-900.webp"]) expect((await request.get(f)).ok(), f).toBe(true);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
  const broken = () => page.$$eval("img", (imgs) => imgs.filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute("src")));
  await expect.poll(broken, { timeout: 10_000 }).toEqual([]);
});

test("the making is told as a scroll story: each step takes its turn, and all five notes stay", async ({ page }) => {
  await page.goto("/?lang=en");
  await expect(page.locator("#story")).toHaveClass(/moving/);
  const story = await page.locator("#story").evaluate((el) => ({ top: el.getBoundingClientRect().top + scrollY, run: el.offsetHeight - innerHeight }));
  const names = ["Clay", "Shaping", "Drying", "Firing", "Glazing"];
  for (let i = 0; i < 5; i++) {
    await page.evaluate((y) => scrollTo(0, y), story.top + (story.run * i) / 4);
    await expect(page.locator(".lines li.on h3")).toHaveText(names[i]);
  }
  const shown = await page.$$eval("#steps .card", (cs) => cs.map((c) => +getComputedStyle(c).opacity));
  expect(shown.every((o) => o > 0)).toBe(true);
  const rotated = await page.$$eval("#steps .card", (cs) => cs.some((c) => /rotate/.test(c.style.transform)));
  expect(rotated).toBe(false);
});

test("with reduced motion the making is a plain list of five cards", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/?lang=en");
  await expect(page.locator("#story")).not.toHaveClass(/moving/);
  for (const c of await page.locator("#steps .card").all()) await expect(c).toBeVisible();
  await context.close();
});

test("the shell piece is called a palette", async ({ page }) => {
  await page.goto("/?lang=en");
  await expect(page.locator("#prints")).toContainText("Palette");
  await page.goto("/?lang=pt");
  await expect(page.locator("#prints")).toContainText("Paleta");
});

test("Portuguese copy is impersonal: it never says tu", async ({ page }) => {
  await page.goto("/?lang=pt");
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\b(tens|envia|gostes|recebes|teu|tua|podes|queres|fala)\b/i);
});

test("the main page links only to its own order page and the email", async ({ page }) => {
  await page.goto("/?lang=en");
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  for (const h of hrefs) expect(h).toMatch(/^(#.+|\/order\/\?lang=(en|pt)|mailto:mail@ivolopes\.com)$/);
});
