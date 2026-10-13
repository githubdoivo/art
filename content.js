// Page content in both languages. Each section drives one stage of the clay
// (see clay.js): 0 ball · 1 pinched open · 2 pinch bowl · 3 first coils ·
// 4 coils built up · 5 smoothed and shaped · 6 bisque · 7 glazed.
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
      { id: "top", eyebrow: "// ceramics · Porto", title: "Ivo Lopes", lead: "Earth, water, fire and time.", body: ["Ceramics, built by hand. Scroll down and follow a ball of clay all the way to a finished jar."] },
      { id: "wedge", eyebrow: "01 · prepare", title: "It starts as a ball", body: ["Clay is wedged first: pressed, folded and turned on the bench until the air is out and it is even all the way through. Then it is rolled into a ball.", "Skip it, and a hidden air pocket can crack the piece in the kiln weeks later."] },
      { id: "pinch", eyebrow: "02 · pinch", title: "Pinch it open", body: ["A thumb goes into the ball. Turning it slowly in the hand, the walls are pinched out between thumb and fingers, a little thinner with every round."] },
      { id: "base", eyebrow: "03 · base", title: "A small bowl", body: ["The pinched form becomes a bowl with an even wall: the base everything else is built on."] },
      { id: "coil", eyebrow: "04 · coil", title: "Coil by coil", body: ["Clay is rolled into long ropes and laid around the rim one coil at a time, each one scored and joined to the last with slip. Placing a coil slightly in or out is how the form starts to curve."] },
      { id: "work", eyebrow: "05 · shape", title: "Work", body: ["The coils are blended into one smooth skin with fingers and a wooden rib. No two pieces come out alike, and each keeps a little of the hands that made it. A few pieces:"], gallery: true },
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
      { id: "top", eyebrow: "// cerâmica · Porto", title: "Ivo Lopes", lead: "Terra, água, fogo e tempo.", body: ["Cerâmica construída à mão. Desliza para baixo e acompanha uma bola de barro até ser um jarro acabado."] },
      { id: "wedge", eyebrow: "01 · preparar", title: "Começa numa bola", body: ["Primeiro, o barro é amassado: pressionado, dobrado e rodado na bancada até sair o ar e ficar uniforme por dentro. Depois, enrola-se numa bola.", "Sem este passo, uma bolha de ar escondida pode rachar a peça no forno semanas depois."] },
      { id: "pinch", eyebrow: "02 · beliscar", title: "Abrir com o polegar", body: ["Um polegar entra na bola. A rodar devagar na mão, as paredes vão sendo apertadas entre o polegar e os dedos, um pouco mais finas a cada volta."] },
      { id: "base", eyebrow: "03 · base", title: "Uma pequena taça", body: ["A forma beliscada passa a uma taça de parede uniforme: a base onde tudo o resto é construído."] },
      { id: "coil", eyebrow: "04 · rolos", title: "Rolo a rolo", body: ["O barro é enrolado em cordas compridas, assentes à volta do bordo um rolo de cada vez, cada um riscado e colado ao anterior com barbotina. Pôr um rolo um pouco mais para dentro ou para fora é o que começa a curvar a forma."] },
      { id: "work", eyebrow: "05 · moldar", title: "Trabalhos", body: ["Os rolos são fundidos numa só pele lisa, com os dedos e uma costela de madeira. Não há duas peças iguais, e cada uma guarda um pouco das mãos que a fizeram. Algumas peças:"], gallery: true },
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
