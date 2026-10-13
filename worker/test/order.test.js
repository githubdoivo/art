import { test } from "node:test";
import assert from "node:assert/strict";
import { validate, orderId, emailText, corsHeaders } from "../src/order.js";

const photo = (type = "image/jpeg", size = 1000) => new File([new Uint8Array(size)], "p.jpg", { type });
function form(overrides = {}) {
  const f = new FormData();
  const base = { name: "Ana Silva", email: "Ana@Example.com", description: "A tall jar with a blue glaze, like this one.", lang: "pt", consent: "yes" };
  for (const [k, v] of Object.entries({ ...base, ...overrides })) if (v !== undefined) f.append(k, v);
  for (const p of overrides.photos ?? [photo()]) f.append("photos", p);
  return f;
}

test("a complete request passes, cleaned up", () => {
  const o = validate(form());
  assert.equal(o.error, undefined);
  assert.equal(o.email, "ana@example.com", "email is lower-cased");
  assert.equal(o.lang, "pt");
  assert.equal(o.photos.length, 1);
});

for (const [why, overrides, error] of [
  ["no name", { name: "  " }, "invalid_name"],
  ["a name that is far too long", { name: "x".repeat(81) }, "invalid_name"],
  ["a broken email", { email: "ana@example" }, "invalid_email"],
  ["a description that says nothing", { description: "jar" }, "invalid_description"],
  ["no consent", { consent: undefined }, "consent_required"],
  ["no photo", { photos: [] }, "invalid_photos"],
  ["four photos", { photos: [photo(), photo(), photo(), photo()] }, "invalid_photos"],
  ["a file that is not an image", { photos: [photo("application/pdf")] }, "invalid_photos"],
  ["a photo over 4 MB", { photos: [photo("image/jpeg", 4 * 1024 * 1024 + 1)] }, "photo_too_large"],
]) {
  test(`refused: ${why}`, () => assert.equal(validate(form(overrides)).error, error));
}

test("order ids read well: date plus an unambiguous code", () => {
  const id = orderId(new Date("2026-10-13T12:00:00Z"), new Uint8Array([0, 1, 30, 31]));
  assert.equal(id, "ORD-261013-AB89");
  assert.match(orderId(), /^ORD-\d{6}-[A-HJ-NP-Z2-9]{4}$/);
});

test("the owner's email says who, what, and that replying reaches them", () => {
  const text = emailText("ORD-261013-AB89", { name: "Ana", email: "ana@example.com", lang: "pt", photos: [1, 2], description: "A blue jar." });
  assert.match(text, /Ana <ana@example.com>/);
  assert.match(text, /Portuguese/);
  assert.match(text, /2 attached/);
  assert.match(text, /A blue jar\./);
  assert.match(text, /Reply to this email to answer Ana directly/);
});

test("only the art site may post orders", () => {
  const env = { ALLOWED_ORIGINS: "https://art.ivolopes.com,http://localhost:8790" };
  const req = (origin) => new Request("https://orders.ivolopes.com/orders", { headers: { Origin: origin } });
  assert.equal(corsHeaders(req("https://art.ivolopes.com"), env)["Access-Control-Allow-Origin"], "https://art.ivolopes.com");
  assert.equal(corsHeaders(req("https://evil.example"), env)["Access-Control-Allow-Origin"], undefined);
});
