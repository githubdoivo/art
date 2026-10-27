// art.ivolopes.com/order/: the order form as a page of the sketchbook.
// Same content and languages as the home page.
import { orderFormHtml, wireOrderForm } from "./order.js";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
let saved = null;
try { saved = localStorage.getItem("lang"); } catch (_) {}
const wanted = params.get("lang") || saved || ((navigator.language || "").toLowerCase().startsWith("pt") ? "pt" : "en");
const c = window.CONTENT[wanted === "pt" ? "pt" : "en"];
if (params.get("lang")) { try { localStorage.setItem("lang", c.lang); } catch (_) {} }
document.documentElement.lang = c.lang;
document.title = c.orderPage.title;

const o = c.orderPage;
$("#order-title").textContent = o.heading;
$("#order-intro").textContent = o.intro;
$("#order-note").textContent = o.note;
$("#order-piece").alt = c.book.pieces.find((p) => p.img === "blue").alt;
$("#footer").textContent = c.footer;
$("#form-slot").outerHTML = orderFormHtml(c.form);
wireOrderForm(c.form, c.lang);

const back = $("#back-link");
back.href = `/?lang=${c.lang}`;
back.textContent = o.back;

const lang = $("#lang-toggle");
lang.textContent = c.switchLang;
lang.setAttribute("aria-label", c.switchLangLabel);
lang.title = c.switchLangLabel;
lang.addEventListener("click", () => {
  const next = c.lang === "pt" ? "en" : "pt";
  try { localStorage.setItem("lang", next); } catch (_) {}
  location.href = `${location.pathname}?lang=${next}`;
});
