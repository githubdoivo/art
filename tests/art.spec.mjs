import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function scrollToSection(page, i) {
  await page.evaluate((i) => {
    const s = document.querySelectorAll(".section")[i];
    window.scrollTo(0, s.offsetTop + s.offsetHeight / 2 - innerHeight / 2);
  }, i);
}
const stageOf = (page) => page.locator("#clay").evaluate((c) => parseFloat(c.dataset.stage));

for (const lang of ["en", "pt"]) {
  test(`${lang}: every section renders, with no errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/?lang=${lang}`);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator(".section")).toHaveCount(9);
    await expect(page.locator(".piece")).toHaveCount(3);
    await expect(page.locator("#contact a[href^='mailto:']")).toHaveAttribute("href", "mailto:mail@ivolopes.com");
    expect(errors).toEqual([]);
  });
}

test("scrolling shapes the clay: each section brings its own stage", async ({ page }) => {
  await page.goto("/?lang=en");
  await expect(page.locator("#clay")).toHaveAttribute("data-stage", /\d/);
  for (let i = 0; i < 8; i++) {
    await scrollToSection(page, i);
    await expect.poll(() => stageOf(page), { message: `section ${i}` }).toBeCloseTo(i, 0);
  }
});

test("the kiln glows during the firing, and only then", async ({ page }) => {
  await page.goto("/?lang=en");
  const glow = () => page.locator("#clay").evaluate((c) => parseFloat(c.dataset.glow));
  await scrollToSection(page, 4);
  await expect.poll(glow).toBe(0);
  await page.evaluate(() => {
    const a = document.querySelectorAll(".section")[5], b = document.querySelectorAll(".section")[6];
    window.scrollTo(0, (a.offsetTop + a.offsetHeight / 2 + b.offsetTop + b.offsetHeight / 2) / 2 - innerHeight / 2);
  });
  await expect.poll(glow).toBeGreaterThan(0.5);
  await scrollToSection(page, 7);
  await expect.poll(glow).toBe(0);
});

test("on a phone, the text never sits on top of the clay", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone layout only");
  await page.goto("/?lang=en");
  const stageBottom = await page.locator(".stage").evaluate((s) => s.getBoundingClientRect().bottom);
  for (let i = 0; i < 8; i++) {
    await scrollToSection(page, i);
    await page.waitForTimeout(150);
    // Measured when the section is centred, which is when its stage shows.
    const cardTop = await page.locator(".section").nth(i).locator(".card").evaluate((c) => c.getBoundingClientRect().top);
    expect(cardTop, `section ${i}'s card covers the clay`).toBeGreaterThanOrEqual(stageBottom * 0.9);
  }
});

test("on a wide screen, text and clay sit side by side", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop layout only");
  await page.goto("/?lang=en");
  const textRight = await page.locator("main").evaluate((m) => m.getBoundingClientRect().right);
  const stageLeft = await page.locator(".stage").evaluate((s) => s.getBoundingClientRect().left);
  expect(textRight).toBeLessThanOrEqual(stageLeft + 1);
});

test("without WebGL, a still jar stands in", async ({ page }) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/.test(type) ? null : get.call(this, type, ...rest);
    };
  });
  await page.goto("/?lang=en");
  await expect(page.locator("html")).toHaveClass(/no-webgl/);
  await expect(page.locator(".fallback-jar")).toBeVisible();
  await expect(page.locator(".section").first()).toBeVisible();
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
  await page.goto("/?lang=pt");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test("no serious accessibility problems", async ({ page }) => {
  await page.goto("/?lang=en");
  for (let i = 0; i < 8; i++) { await scrollToSection(page, i); await page.waitForTimeout(120); }
  // Cards fade in as they arrive; scanning mid-fade measures half-transparent
  // text. Let every transition land first.
  await page.evaluate(() => {
    document.querySelectorAll(".section").forEach((s) => s.classList.add("in"));
    // Only animations that end: the scroll hint's drip loops forever on purpose.
    const finite = document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity);
    // A fade can be interrupted and restarted; settled either way is fine.
    return Promise.allSettled(finite.map((a) => a.finished));
  });
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
  await expect(cta).toHaveText("Encomendar uma peça →");
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
