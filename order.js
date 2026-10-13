// The "Order a piece" form: photo previews, shrinking photos in the browser
// before upload, Cloudflare Turnstile (loaded only when the form comes near),
// and sending to the order Worker (worker/src/index.js).
const ENDPOINT = "https://orders.ivolopes.com/orders";
const TURNSTILE_SITEKEY = "0x4AAAAAAFVrpW6Vu6CS5hyk";
const MAX_PHOTOS = 3;
const MAX_SIDE = 1600;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function orderFormHtml(f) {
  return `<form class="order-form" id="order-form" novalidate>
    <label>${esc(f.name)}<input name="name" autocomplete="name" maxlength="80" required></label>
    <label>${esc(f.email)}<input name="email" type="email" autocomplete="email" maxlength="160" required></label>
    <label>${esc(f.description)}<textarea name="description" rows="4" maxlength="2000" placeholder="${esc(f.descriptionHint)}" required></textarea></label>
    <div class="photos-field">
      <span class="label">${esc(f.photos)}</span>
      <span class="photos-hint">${esc(f.photosHint)}</span>
      <div class="previews" id="order-previews"></div>
      <label class="btn choose">${esc(f.choose)}<input id="order-photos" type="file" accept="image/*" multiple hidden></label>
    </div>
    <label class="consent"><input type="checkbox" name="consent" value="yes"> <span>${esc(f.consent)}</span></label>
    <div id="order-turnstile" class="turnstile"></div>
    <button class="btn primary" type="submit" id="order-send">${esc(f.send)}</button>
    <p class="order-status" id="order-status" role="status" aria-live="polite"></p>
  </form>`;
}

/** Downscale to MAX_SIDE and re-encode as JPEG; falls back to the original. */
async function shrink(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

/** Renders the Turnstile widget; onToken runs with each new token it issues. */
function loadTurnstile(container, lang, onToken) {
  const render = () => window.turnstile.render(container, {
    sitekey: TURNSTILE_SITEKEY,
    language: lang,
    theme: "auto",
    callback: onToken,
    "expired-callback": () => onToken(null),
  });
  if (window.turnstile) return render();
  window.__onTurnstile = render;
  const s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__onTurnstile";
  s.async = true;
  document.head.appendChild(s);
}

export function wireOrderForm(f, lang) {
  const form = document.getElementById("order-form");
  if (!form) return;
  const status = document.getElementById("order-status");
  const send = document.getElementById("order-send");
  const previews = document.getElementById("order-previews");
  const input = document.getElementById("order-photos");
  let photos = [];
  // The spam check's token: single-use, so it is replaced after every send.
  let token = null, waiting = [];
  const onToken = (t) => { token = t; if (t) { waiting.forEach((r) => r(t)); waiting = []; } };
  const nextToken = () => token ? Promise.resolve(token) : new Promise((resolve) => {
    waiting.push(resolve);
    setTimeout(() => resolve(null), 15000);
  });

  // Only fetch the spam check once the form is close.
  let loaded = false;
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting) && !loaded) {
      loaded = true;
      loadTurnstile(document.getElementById("order-turnstile"), lang, onToken);
      io.disconnect();
    }
  }, { rootMargin: "400px" });
  io.observe(form);

  function renderPreviews() {
    previews.innerHTML = photos.map((p, i) => `<figure><img src="${p.url}" alt=""><button type="button" data-i="${i}" aria-label="${esc(f.remove)}">×</button></figure>`).join("");
  }
  previews.addEventListener("click", (e) => {
    const i = e.target.dataset?.i;
    if (i === undefined) return;
    URL.revokeObjectURL(photos[i].url);
    photos.splice(+i, 1);
    renderPreviews();
  });
  input.addEventListener("change", async () => {
    for (const file of [...input.files].slice(0, MAX_PHOTOS - photos.length)) {
      const small = await shrink(file);
      photos.push({ file: small, url: URL.createObjectURL(small) });
    }
    input.value = "";
    renderPreviews();
  });

  const show = (msg, kind) => { status.textContent = msg; status.dataset.kind = kind; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const local =
      !String(data.get("name") || "").trim() ? "invalid_name" :
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.get("email") || "").trim()) ? "invalid_email" :
      String(data.get("description") || "").trim().length < 10 ? "invalid_description" :
      photos.length < 1 ? "invalid_photos" :
      data.get("consent") !== "yes" ? "consent_required" : null;
    if (local) return show(f.errors[local], "error");

    send.disabled = true;
    show(f.sending, "busy");
    try {
      const t = await nextToken();
      data.delete("photos");
      for (const p of photos) data.append("photos", p.file);
      data.append("lang", lang);
      data.append("cf-turnstile-response", t || "");
      const res = await fetch(ENDPOINT, { method: "POST", body: data });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        form.reset();
        photos = [];
        renderPreviews();
        show(f.done.replace("{id}", body.id), "done");
      } else {
        show(f.errors[body.error] || f.errors.server_error, "error");
      }
    } catch {
      show(f.errors.network, "error");
    } finally {
      send.disabled = false;
      // Used or not, the token is spent: ask for a fresh one.
      token = null;
      window.turnstile?.reset();
    }
  });
}
