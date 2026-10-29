// The sketchbook home page: fills index.html from content.js in the
// visitor's language (?lang=, then their last choice, then the browser).
(function () {
  const params = new URLSearchParams(location.search);
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (_) {}
  const wanted = params.get("lang") || saved || ((navigator.language || "").toLowerCase().startsWith("pt") ? "pt" : "en");
  const c = window.CONTENT[wanted === "pt" ? "pt" : "en"];
  const b = c.book;
  if (params.get("lang")) { try { localStorage.setItem("lang", c.lang); } catch (_) {} }
  document.documentElement.lang = c.lang;
  document.title = c.title;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  $("#kind").textContent = c.lang === "pt" ? "Cerâmica" : "Ceramics";
  $("#tagline").textContent = b.tagline;
  $("#seal").alt = b.sealAlt;
  const lang = $("#lang-toggle");
  lang.textContent = c.switchLang;
  lang.setAttribute("aria-label", c.switchLangLabel);
  lang.title = c.switchLangLabel;
  lang.addEventListener("click", () => {
    const next = c.lang === "pt" ? "en" : "pt";
    try { localStorage.setItem("lang", next); } catch (_) {}
    location.href = `${location.pathname}?lang=${next}${location.hash}`;
  });

  // Strips of washi tape, reused in a fixed order so the page looks the same each visit.
  const tapes = ["sand", "sage", "clay", "blue", "ochre", "rice"];
  const tape = (i, cls = "") => `<img class="tape ${cls}" src="book/tape-${tapes[i % tapes.length]}.webp" alt="" aria-hidden="true">`;
  const tilt = [-2.2, 1.6, -1, 2, -1.6, 1.2];
  const steps = ["clay", "shaping", "drying", "firing", "glazing"];

  $("#making-title").textContent = b.making;
  $("#steps").innerHTML = b.steps.map(([name, line], i) => `
    <li class="card" style="--tilt:${tilt[i]}deg">
      ${tape(i)}
      <img class="drawing" src="book/step-${steps[i]}.webp" alt="" loading="lazy">
      <p><span class="num">${i + 1}.</span> ${esc(name)}<br><em>${esc(line)}</em></p>
    </li>`).join("");
  $("#lines").innerHTML = b.steps.map(([name, line, story], i) => `
    <li><span class="big-num">${i + 1}</span><h3>${esc(name)}</h3><p class="line">${esc(line)}</p><p class="tale">${esc(story)}</p></li>`).join("");
  $("#hint").textContent = b.scrollHint;
  story(b.steps.length);

  $("#work-title").textContent = b.work;
  $("#work-note").textContent = b.workNote;
  $("#prints").innerHTML = b.pieces.map((p, i) => `
    <li class="print" style="--tilt:${tilt[(i + 2) % tilt.length]}deg">
      ${tape(i + 3, i % 2 ? "right" : "left")}
      <img class="piece" src="book/work-${p.img}.webp" width="720" height="900" alt="${esc(p.alt)}" loading="lazy">
      <span class="caption">${esc(p.title)}</span>
    </li>`).join("");

  $("#porto-title").textContent = b.porto;
  $("#porto-line").textContent = b.portoLine;
  $("#porto-art").alt = b.portoAlt;

  $("#order-title").textContent = b.orderTitle;
  $("#order-text").textContent = b.orderText;
  const cta = $("#order-cta");
  cta.textContent = b.orderButton;
  cta.href = `/order/?lang=${c.lang}`;
  $("#footer").textContent = c.footer;
  $(".skip").textContent = c.skip;

  // The making as a scroll story: the section is tall and its stage sticks to
  // the screen. Scroll progress p runs 0..n-1; drawing i drops onto the pile as
  // p passes i, and older drawings slide back into the pile. Text follows p.
  function story(n) {
    const box = $("#story");
    const calm = matchMedia("(prefers-reduced-motion: reduce)");
    if (calm.matches) return; // a plain list stays
    box.classList.add("moving");
    const cards = [...box.querySelectorAll(".card")];
    const lines = [...box.querySelectorAll(".lines li")];
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    let queued = false;
    const draw = () => {
      queued = false;
      const r = box.getBoundingClientRect();
      const run = r.height - innerHeight;
      const p = clamp(-r.top / run, 0, 1) * (n - 1);
      const now = Math.round(p);
      cards.forEach((c, i) => {
        // Each note is pressed onto the wall right on top of the last one.
        // Older notes stay underneath.
        const t = i === 0 ? 1 : clamp((p - i) * 2 + 1, 0, 1); // 0 = not yet, 1 = stuck down
        const e = 1 - Math.pow(1 - t, 3);
        const under = clamp(p - i, 0, 1);
        const lift = 1 - e; // a note is held up off the wall, then pressed flat
        c.style.transform = `translate(0, ${-lift * 6}%) scale(${1 + lift * .12})`;
        c.style.opacity = t <= 0 ? 0 : Math.min(1, e * 1.6) * (1 - under * .3);
        c.style.setProperty("--lift", lift.toFixed(3));
        c.style.zIndex = i;
      });
      lines.forEach((l, i) => l.classList.toggle("on", i === now));
      box.classList.toggle("started", p > .15);
    };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", ask);
    draw();
  }
})();
