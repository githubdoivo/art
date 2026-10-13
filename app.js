import { createClay } from "./clay.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Language: ?lang=, then the last choice, then the browser ------ */
const params = new URLSearchParams(location.search);
let saved = null;
try { saved = localStorage.getItem("lang"); } catch (_) {}
const wanted = params.get("lang") || saved || ((navigator.language || "").toLowerCase().startsWith("pt") ? "pt" : "en");
const c = window.CONTENT[wanted === "pt" ? "pt" : "en"];
if (params.get("lang")) { try { localStorage.setItem("lang", c.lang); } catch (_) {} }
document.documentElement.lang = c.lang;
document.title = c.title;

const langBtn = $("#lang-toggle");
langBtn.textContent = c.switchLang;
langBtn.setAttribute("aria-label", c.switchLangLabel);
langBtn.title = c.switchLangLabel;
langBtn.addEventListener("click", () => {
  const next = c.lang === "pt" ? "en" : "pt";
  try { localStorage.setItem("lang", next); } catch (_) {}
  location.href = `${location.pathname}?lang=${next}`;
});
$("#theme-toggle").setAttribute("aria-label", c.themeLabel);
$("#footer-text").textContent = c.footer;

/* ---------- Content -------------------------------------------------------- */
const jarIcon = `<svg viewBox="0 0 200 260" aria-hidden="true"><path d="M78 20h44c-2 10-10 14-10 24 0 14 44 40 44 96 0 58-30 94-56 100h0c-26-6-56-42-56-100 0-56 44-82 44-96 0-10-8-14-10-24z" fill="none" stroke="currentColor" stroke-width="6"/></svg>`;

$("#content").innerHTML = c.sections.map((s, i) => {
  const heading = i === 0 ? `<h1>${esc(s.title)}</h1>` : `<h2>${esc(s.title)}</h2>`;
  const gallery = s.gallery ? `<div class="gallery">${c.work.map((w) => `
      <figure class="piece">
        <div class="photo">${w.photo ? `<img src="${esc(w.photo)}" alt="${esc(w.title)}" loading="lazy">` : jarIcon}</div>
        <figcaption>${esc(w.title)}<small>${esc(w.note)}</small></figcaption>
      </figure>`).join("")}</div>` : "";
  const contact = s.contact ? `<div class="contact-links">
      <a class="btn primary" href="mailto:${esc(c.email)}">${esc(c.email)}</a>
    </div>` : "";
  return `<section class="section" id="${esc(s.id)}" data-stage="${i}">
    <div class="card">
      <p class="eyebrow">${esc(s.eyebrow)}</p>
      ${heading}
      ${s.lead ? `<p class="lead">${esc(s.lead)}</p>` : ""}
      ${s.body.map((p) => `<p>${esc(p)}</p>`).join("")}
      ${gallery}${contact}${s.order ? `<div class="contact-links"><a class="btn primary" id="order-cta" href="/order/?lang=${c.lang}">${esc(c.orderCta)}</a></div>` : ""}
      ${i === 0 ? `<p class="hint">${esc(c.scrollHint)}</p>` : ""}
    </div>
  </section>`;
}).join("");

const sections = [...document.querySelectorAll(".section")];

// Text eases in as each section arrives.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) e.target.classList.add("in");
}, { threshold: 0.2 });
sections.forEach((s) => io.observe(s));

/* ---------- Theme ---------------------------------------------------------- */
const root = document.documentElement;
$("#theme-toggle").addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (_) {}
});

/* ---------- Scroll -> stage ------------------------------------------------ */
// Stage i is reached when section i sits in the middle of the screen; in
// between, the clay is part-way from one stage to the next.
function currentStage() {
  const mid = window.innerHeight * 0.5;
  const centres = sections.map((s) => { const r = s.getBoundingClientRect(); return r.top + r.height / 2; });
  if (mid <= centres[0]) return 0;
  for (let i = 0; i < centres.length - 1; i++) {
    if (mid <= centres[i + 1]) return i + (mid - centres[i]) / (centres[i + 1] - centres[i]);
  }
  return centres.length - 1;
}

let clay = null;
try {
  // ?style= previews the other art styles (see STYLES in clay.js).
  clay = createClay($("#clay"), { reducedMotion, style: params.get("style") || "toon" });
} catch (err) {
  // No WebGL: a still drawing of the finished jar stands in.
  document.documentElement.classList.add("no-webgl");
  console.warn("WebGL unavailable, showing the still jar instead.", err);
}

const bar = $("#progress-bar"), glowEl = $("#kiln-glow"), canvas = $("#clay");
function onScroll() {
  const s = currentStage();
  clay?.setStage(s);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  glowEl.style.opacity = canvas.dataset.glow || 0;
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();
// The glow value comes from the clay's last frame, so keep it in step.
(function syncGlow() { glowEl.style.opacity = canvas.dataset.glow || 0; requestAnimationFrame(syncGlow); })();
