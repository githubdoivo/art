// art.ivolopes.com/order/ - the order form on its own page, beside the
// finished jar. Same content, languages and theme as the main page.
import { createClay } from "./clay.js";
import { orderFormHtml, wireOrderForm } from "./order.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

const params = new URLSearchParams(location.search);
let saved = null;
try { saved = localStorage.getItem("lang"); } catch (_) {}
const wanted = params.get("lang") || saved || ((navigator.language || "").toLowerCase().startsWith("pt") ? "pt" : "en");
const c = window.CONTENT[wanted === "pt" ? "pt" : "en"];
if (params.get("lang")) { try { localStorage.setItem("lang", c.lang); } catch (_) {} }
document.documentElement.lang = c.lang;
document.title = c.orderPage.title;

const section = c.sections.find((s) => s.order);
$("#content").innerHTML = `<section class="section in" id="order">
  <div class="card">
    <p class="eyebrow">${esc(section.eyebrow)}</p>
    <h1>${esc(section.title)}</h1>
    ${section.body.map((p) => `<p>${esc(p)}</p>`).join("")}
    ${orderFormHtml(c.form)}
  </div>
</section>`;
wireOrderForm(c.form, c.lang);

const home = `/?lang=${c.lang}`;
$("#home-link").href = home;
$("#back-link").href = home;
$("#back-link").textContent = c.orderPage.back;

const langBtn = $("#lang-toggle");
langBtn.textContent = c.switchLang;
langBtn.setAttribute("aria-label", c.switchLangLabel);
langBtn.addEventListener("click", () => {
  const next = c.lang === "pt" ? "en" : "pt";
  try { localStorage.setItem("lang", next); } catch (_) {}
  location.href = `${location.pathname}?lang=${next}`;
});

const root = document.documentElement;
$("#theme-toggle").setAttribute("aria-label", c.themeLabel);
$("#theme-toggle").addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (_) {}
});

try {
  createClay($("#clay"), { reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches }).setStage(7);
} catch {
  root.classList.add("no-webgl");
}
