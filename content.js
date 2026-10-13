// Page content in both languages. Each section drives one stage of the clay
// (see clay.js): 0 lump · 1 wedged · 2 centred · 3 opened · 4 pulled ·
// 5 shaped · 6 bisque · 7 glazed.
//
// PLACEHOLDERS to replace when ready: the three pieces under "work" (titles,
// notes and photos - put photos in images/ and set `photo`).
window.CONTENT = {
  en: {
    lang: "en",
    title: "Ivo Lopes · Ceramics",
    switchLang: "PT", switchLangLabel: "Ver em português",
    themeLabel: "Toggle dark or light theme",
    scrollHint: "Scroll to shape the clay",
    cv: "CV ↗",
    sections: [
      { id: "top", eyebrow: "// ceramics · Porto", title: "Ivo Lopes", lead: "Earth, water, fire and time.", body: ["Ceramics, made by hand. Scroll down and follow a lump of clay all the way to a finished jar."] },
      { id: "wedge", eyebrow: "01 · wedge", title: "It starts as a lump", body: ["Clay is wedged first: pressed, folded and turned on the bench, again and again, until the air is out and it is even all the way through.", "Skip it, and a hidden air pocket can crack the piece in the kiln weeks later."] },
      { id: "centre", eyebrow: "02 · centre", title: "Find the centre", body: ["On the wheel, the clay is coned up and pressed down until it runs perfectly true. Off-centre by a millimetre now, and every wall that follows wobbles."] },
      { id: "open", eyebrow: "03 · open", title: "Open it up", body: ["Thumbs press down into the spinning clay and draw the floor out, leaving enough thickness at the bottom to trim a foot later."] },
      { id: "pull", eyebrow: "04 · pull", title: "Pull the walls", body: ["Pull after pull, the walls are lifted thinner and taller between the fingers. Each pass leaves a faint ring, the marks of how a piece was made."] },
      { id: "work", eyebrow: "05 · shape", title: "Work", body: ["Belly, shoulder, neck, lip: the cylinder becomes a form. A few pieces:"], gallery: true },
      { id: "fire", eyebrow: "06 · fire", title: "Through the fire", body: ["Bone dry, the piece goes into the kiln for its first firing, the bisque, at around 950°C. Clay turns into ceramic and shrinks a little on the way.", "Then glaze, and a second, hotter firing that melts it into glass."] },
      { id: "contact", eyebrow: "07 · glaze", title: "Finished", body: ["Questions, commissions, or just to talk clay:"], contact: true },
    ],
    work: [
      { title: "Piece I", note: "Photo coming soon" },
      { title: "Piece II", note: "Photo coming soon" },
      { title: "Piece III", note: "Photo coming soon" },
    ],
    email: "mail@ivolopes.com",
    footer: "Made by hand, and in code.",
  },
  pt: {
    lang: "pt",
    title: "Ivo Lopes · Cerâmica",
    switchLang: "EN", switchLangLabel: "View in English",
    themeLabel: "Alternar tema claro ou escuro",
    scrollHint: "Desliza para moldar o barro",
    cv: "CV ↗",
    sections: [
      { id: "top", eyebrow: "// cerâmica · Porto", title: "Ivo Lopes", lead: "Terra, água, fogo e tempo.", body: ["Cerâmica feita à mão. Desliza para baixo e acompanha um pedaço de barro até ser um jarro acabado."] },
      { id: "wedge", eyebrow: "01 · amassar", title: "Começa num pedaço de barro", body: ["Primeiro, o barro é amassado: pressionado, dobrado e rodado na bancada, vezes sem conta, até sair o ar e ficar uniforme por dentro.", "Sem este passo, uma bolha de ar escondida pode rachar a peça no forno semanas depois."] },
      { id: "centre", eyebrow: "02 · centrar", title: "Encontrar o centro", body: ["Na roda, o barro sobe em cone e volta a descer até rodar perfeitamente direito. Um milímetro fora do centro agora, e todas as paredes que se seguem abanam."] },
      { id: "open", eyebrow: "03 · abrir", title: "Abrir a peça", body: ["Os polegares entram no barro a rodar e alargam o fundo, deixando espessura suficiente em baixo para tornear um pé mais tarde."] },
      { id: "pull", eyebrow: "04 · puxar", title: "Puxar as paredes", body: ["Puxada a puxada, as paredes sobem mais finas e mais altas entre os dedos. Cada passagem deixa um anel ténue, as marcas de como a peça foi feita."] },
      { id: "work", eyebrow: "05 · moldar", title: "Trabalhos", body: ["Bojo, ombro, gargalo, bordo: o cilindro ganha forma. Algumas peças:"], gallery: true },
      { id: "fire", eyebrow: "06 · cozer", title: "Pelo fogo", body: ["Bem seca, a peça vai ao forno para a primeira cozedura, a chacota, a cerca de 950°C. O barro passa a cerâmica e encolhe um pouco pelo caminho.", "Depois vem o vidrado, e uma segunda cozedura, mais quente, que o derrete em vidro."] },
      { id: "contact", eyebrow: "07 · vidrar", title: "Acabado", body: ["Perguntas, encomendas, ou só para falar de barro:"], contact: true },
    ],
    work: [
      { title: "Peça I", note: "Fotografia em breve" },
      { title: "Peça II", note: "Fotografia em breve" },
      { title: "Peça III", note: "Fotografia em breve" },
    ],
    email: "mail@ivolopes.com",
    footer: "Feito à mão, e em código.",
  },
};
