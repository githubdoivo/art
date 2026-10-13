// Order requests from art.ivolopes.com.
//
// POST /orders (multipart form): name, email, description, lang, consent,
// cf-turnstile-response, and 1-3 photos (already shrunk to JPEG in the
// browser). The request is checked (Turnstile, fields, size, a per-visitor
// hourly limit), the photos go to R2, the order to D1, and an email with the
// photos attached goes to the owner - with Reply-To set to the customer, so
// answering it from Gmail replies to them directly.
import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import { corsHeaders, validate, orderId, emailText } from "./order.js";

const MAX_PER_HOUR = 5;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname === "/health") return json({ ok: true }, 200, cors);
    if (url.pathname === "/orders" && request.method === "POST") {
      if (!cors["Access-Control-Allow-Origin"]) return json({ error: "origin_not_allowed" }, 403, cors);
      try {
        return await createOrder(request, env, cors);
      } catch (err) {
        console.error("order failed", err);
        return json({ error: "server_error" }, 500, cors);
      }
    }
    return json({ error: "not_found" }, 404, cors);
  },
};

const json = (body, status, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(token, ip, secret) {
  if (!token) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const data = await res.json();
  return data.success === true;
}

async function createOrder(request, env, cors) {
  const form = await request.formData();
  const ip = request.headers.get("CF-Connecting-IP") || "";

  if (!(await verifyTurnstile(form.get("cf-turnstile-response"), ip, env.TURNSTILE_SECRET))) {
    return json({ error: "captcha_failed" }, 400, cors);
  }
  const order = validate(form);
  if (order.error) return json({ error: order.error }, 400, cors);

  const ipHash = ip ? await sha256(`${ip}:${env.TURNSTILE_SECRET}`) : null;
  if (ipHash) {
    const { n } = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM orders WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')",
    ).bind(ipHash).first();
    if (n >= MAX_PER_HOUR) return json({ error: "too_many" }, 429, cors);
  }

  const id = orderId();
  const keys = [];
  const attachments = [];
  for (const [i, photo] of order.photos.entries()) {
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const key = `${id}/${i + 1}.${ext}`;
    await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: photo.type } });
    keys.push(key);
    attachments.push({ filename: `${id}-${i + 1}.${ext}`, contentType: photo.type, data: toBase64(bytes) });
  }

  await env.DB.prepare("INSERT INTO orders (id, name, email, description, lang, photos, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, order.name, order.email, order.description, order.lang, JSON.stringify(keys), ipHash)
    .run();

  await notifyOwner(env, id, order, attachments);
  return json({ ok: true, id }, 201, cors);
}

function toBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function notifyOwner(env, id, order, attachments) {
  const msg = createMimeMessage();
  msg.setSender({ name: "art.ivolopes.com orders", addr: env.FROM_EMAIL });
  msg.setRecipient(env.OWNER_EMAIL);
  msg.setHeader("Reply-To", `${order.name.replace(/[<>"]/g, "")} <${order.email}>`);
  msg.setSubject(`Order request ${id} from ${order.name}`);
  msg.addMessage({ contentType: "text/plain", data: emailText(id, order) });
  for (const a of attachments) msg.addAttachment(a);
  await env.MAIL.send(new EmailMessage(env.FROM_EMAIL, env.OWNER_EMAIL, msg.asRaw()));
}
