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
    await expect(page.locator(".section")).toHaveCount(8);
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
