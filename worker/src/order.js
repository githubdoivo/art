// The order form's pure logic, kept free of Cloudflare-only imports so it can
// be unit-tested with plain Node (test/order.test.js).
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const headers = { "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
  if (allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

/** Checks the fields; returns { error } or the cleaned values. */
export function validate(form) {
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const description = String(form.get("description") || "").trim();
  const lang = form.get("lang") === "pt" ? "pt" : "en";
  const photos = form.getAll("photos").filter((f) => f && typeof f === "object" && f.size > 0);
  if (!name || name.length > 80) return { error: "invalid_name" };
  if (!EMAIL_RE.test(email) || email.length > 160) return { error: "invalid_email" };
  if (description.length < 10 || description.length > 2000) return { error: "invalid_description" };
  if (form.get("consent") !== "yes") return { error: "consent_required" };
  if (photos.length < 1 || photos.length > MAX_PHOTOS) return { error: "invalid_photos" };
  for (const p of photos) {
    if (p.size > MAX_PHOTO_BYTES) return { error: "photo_too_large" };
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(p.type || "")) return { error: "invalid_photos" };
  }
  return { name, email, description, lang, photos };
}

export function orderId(now = new Date(), random = crypto.getRandomValues(new Uint8Array(4))) {
  const d = now.toISOString().slice(2, 10).replaceAll("-", "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `ORD-${d}-${[...random].map((b) => alphabet[b % alphabet.length]).join("")}`;
}

export function emailText(id, order) {
  return [
    `New order request ${id}`,
    "",
    `From:     ${order.name} <${order.email}>`,
    `Language: ${order.lang === "pt" ? "Portuguese" : "English"}`,
    `Photos:   ${order.photos.length} attached`,
    "",
    "What they would like:",
    order.description,
    "",
    "--",
    `Reply to this email to answer ${order.name} directly.`,
  ].join("\n");
}

