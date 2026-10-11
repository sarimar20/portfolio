// Footer compartido: "sarimar" con un delfín que salta por encima (sale de la base
// de la palabra, hace un arco y vuelve a entrar, salpicando strass), contacto,
// hora de Buenos Aires y botones para volver arriba. Necesita js/i18n.js antes.
(function () {
  // Pendiente: completar el mail.
  const LINKS = [
    ["Mail", "mailto:"],
    ["Linkedin", "https://www.linkedin.com/in/sara-martinez-469878231/"],
    ["Behance", "https://www.behance.net/saramartinez7"],
  ];
  const STONE = "assets/deco/rhinestone.png";

  const { t } = window.I18N;
  const ARROW_UP = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>';

  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML = `
    <div class="footer__hero">
      <p class="footer__word" aria-hidden="true">sarimar</p>
      <div class="footer__dolphin" aria-hidden="true">
        <img src="assets/deco/dolphin.svg" alt="">
        ${[
          // Strass sobre el lomo del delfín (posiciones del Figma, en % del dibujo).
          [77, 4.9, 2.4], [87.8, 2.5, 2.4], [70.4, 4.1, 2.4],
          [72.8, 0.1, 2.4], [60.3, 1.7, 2.4], [31, 62.9, 4.8],
        ].map(([x, y, s]) => `<img class="footer__gem" src="${STONE}" alt="" style="left:${x}%;top:${y}%;width:${s}%">`).join("")}
      </div>
      <img class="footer__bubble" src="${STONE}" alt="" style="left:22%;top:30%">
      <img class="footer__bubble" src="${STONE}" alt="" style="left:30%;top:62%">
      <img class="footer__bubble" src="${STONE}" alt="" style="left:38%;top:40%">
    </div>
    <div class="footer__info">
      <p class="footer__title">${t("footer.contact")}</p>
      <div class="footer__links">
        ${LINKS.map(([label, href]) =>
          `<a href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`).join("")}
      </div>
      <div class="footer__place">
        <strong>BUENOS AIRES</strong>
        <span class="footer__clock">--:--:--</span>
      </div>
    </div>
    <button type="button" class="footer__top">${t("footer.top")} ↑</button>`;
  document.body.appendChild(footer);

  // Botón redondo flotante para volver arriba (fijo en toda la navegación).
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "to-top";
  fab.setAttribute("aria-label", t("footer.top"));
  fab.innerHTML = ARROW_UP;
  document.body.appendChild(fab);
  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  fab.addEventListener("click", toTop);
  footer.querySelector(".footer__top").addEventListener("click", toTop);

  // Hora de Buenos Aires en vivo.
  const clockEl = footer.querySelector(".footer__clock");
  const fmt = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const tick = () => (clockEl.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 1000);

  const dolphin = footer.querySelector(".footer__dolphin");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    footer.classList.add("is-static");
    return;
  }

  // Orientación del dibujo: el delfín ya mira hacia arriba a la derecha (~32°).
  const DRAWN_ANGLE = -32 * (Math.PI / 180);
  const JUMP = 1.9; // segundos en el aire (incluye entrar y salir del agua)
  const REST = 2.6; // pausa bajo el agua entre saltos

  // El delfín salta dentro del bloque de "sarimar": la base de la palabra es el agua.
  const hero = footer.querySelector(".footer__hero");
  // Dónde está el texto "sarimar" dentro del bloque (está centrado): el delfín
  // salta sobre las primeras letras, igual que antes.
  const wordRange = document.createRange();
  wordRange.selectNodeContents(footer.querySelector(".footer__word"));
  let wordLeft = 0, wordWidth = 0;
  const measureWord = () => {
    const h = hero.getBoundingClientRect(), w = wordRange.getBoundingClientRect();
    wordLeft = w.left - h.left;
    wordWidth = w.width;
  };
  measureWord();
  addEventListener("resize", measureWord);
  if (document.fonts) document.fonts.ready.then(measureWord);
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);

  // Salpicaduras: strass que saltan y caen con gravedad.
  const drops = [];
  function splash(x) {
    for (let i = 0; i < 7; i++) {
      const el = document.createElement("img");
      el.src = STONE;
      el.alt = "";
      el.className = "footer__drop";
      hero.appendChild(el);
      drops.push({
        el, x, y: hero.clientHeight,
        vx: (Math.random() - 0.5) * 260,
        vy: -(260 + Math.random() * 320),
        life: 0,
      });
    }
  }

  let clock = 0, last = performance.now(), splashedIn = false, splashedOut = false;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible) clock += dt;

    const W = hero.clientWidth, H = hero.clientHeight;
    const size = dolphin.offsetWidth;
    const dh = size * (251 / 334);
    const cycle = JUMP + REST;
    const t = (clock % cycle) / JUMP;
    if (clock % cycle < dt) splashedIn = splashedOut = false;

    if (t <= 1) {
      // Centro del delfín: x lineal, y parábola. Arranca y termina sumergido.
      const x0 = wordLeft + wordWidth * 0.02, x1 = wordLeft + wordWidth * 0.42;
      const under = H + dh * 0.75; // totalmente bajo el agua
      const peak = dh * 0.55; // punto más alto, apenas por debajo del borde de arriba
      const x = x0 + (x1 - x0) * t;
      const y = under - 4 * t * (1 - t) * (under - peak);
      const vx = x1 - x0;
      const vy = -4 * (1 - 2 * t) * (under - peak);
      const angle = Math.atan2(vy, vx) - DRAWN_ANGLE;
      dolphin.style.opacity = 1;
      dolphin.style.transform = `translate(${x - size / 2}px, ${y - dh / 2}px) rotate(${angle}rad)`;
      if (!splashedIn && y < H + dh * 0.3) { splashedIn = true; splash(x); }
      if (!splashedOut && t > 0.5 && y > H - dh * 0.1) { splashedOut = true; splash(x); }
    } else {
      dolphin.style.opacity = 0;
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.life += dt;
      d.vy += 1400 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.el.style.transform = `translate(${d.x}px, ${d.y}px)`;
      d.el.style.opacity = Math.max(0, 1 - d.life / 0.9);
      if (d.life > 0.9) { d.el.remove(); drops.splice(i, 1); }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
