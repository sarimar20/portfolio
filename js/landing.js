// Landing: las miniaturas arrancan dispersas y, con el scroll, cada una se
// vuelve un pixel de la flor (js/flower-data.js).
(function () {
  const GAP = 0.06; // separación entre pixels, en fracción de celda

  const landing = document.getElementById("landing");
  const flowerEl = document.getElementById("flower");
  const hint = document.getElementById("hint");
  const label = document.getElementById("label");
  const deco = window.Gravity.mount(document.getElementById("stage"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Random con semilla para que el layout sea el mismo en cada visita.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // ---------- Pixels de la flor ----------
  const rows = window.FLOWER;
  const gridH = rows.length;
  const gridW = rows[0].length;
  const cells = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== ".") cells.push([x, y]);
  });
  // La base del tallo (pixel más bajo) es el punto desde donde se mece la flor.
  const base = cells.reduce((a, c) => (c[1] > a[1] ? c : a));

  // ---------- Miniaturas: rotamos entre proyectos, una por pixel ----------
  const pool = window.PROJECTS.map((p) => {
    const imgs = p.blocks.flatMap((b) => (b.type === "image" ? [b] : b.type === "grid" ? b.images : []));
    const ordered = [p.cover, ...imgs.filter((i) => i.src !== p.cover.src)];
    return ordered.map((img) => ({ img, project: p }));
  });
  let items = [];
  for (let i = 0; pool.some((l) => l.length); i++) {
    const list = pool[i % pool.length];
    if (list.length) items.push(list.shift());
  }
  // Si sobran imágenes, quitamos las más claras (se pierden contra el fondo blanco).
  // Las portadas (primeras de la lista) se quedan siempre.
  const covers = window.PROJECTS.length;
  if (items.length > cells.length) {
    const drop = new Set(
      items
        .slice(covers)
        .sort((a, b) => b.img.lum - a.img.lum)
        .slice(0, items.length - cells.length)
    );
    items = items.filter((it) => !drop.has(it));
  }
  // Si hay más pixels que imágenes, se repiten.
  for (let i = 0; items.length < cells.length; i++) items.push(items[i]);
  items.length = cells.length;

  const targets = cells.slice();
  // Mezclamos para que cada proyecto quede repartido por toda la flor.
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }

  // Posición inicial dispersa, evitando la franja central donde va el texto.
  function startPoint() {
    let x, y;
    do {
      x = rand();
      y = rand();
    } while (y > 0.4 && y < 0.6);
    return [x, y];
  }

  const tiles = items.map((item, i) => {
    const a = document.createElement("a");
    // Color del pixel en el dibujo: r → monocromo rojo, g → verde.
    const kind = rows[targets[i][1]][targets[i][0]];
    a.className = `tile tile--${kind}`;
    a.href = `proyecto.html?p=${item.project.slug}`;
    a.setAttribute("aria-label", item.project.title);
    const img = new Image();
    img.src = item.img.thumb;
    img.alt = "";
    img.decoding = "async";
    a.appendChild(img);
    flowerEl.appendChild(a);
    const t = {
      el: a,
      project: item.project,
      target: targets[i],
      // Al inicio solo se ve una portada por proyecto; el resto aparece al armarse la flor.
      intro: i < window.PROJECTS.length,
      start: startPoint(),
      startScale: 0.75 + rand() * 0.5,
      delay: rand(),
      drift: rand() * Math.PI * 2,
    };
    a.addEventListener("mouseenter", () => {
      label.textContent = t.project.title;
      label.classList.add("is-visible");
    });
    a.addEventListener("mouseleave", () => label.classList.remove("is-visible"));
    return t;
  });

  window.addEventListener("mousemove", (e) => {
    // Si no entra a la derecha, el cartel se muestra a la izquierda del cursor.
    const flip = e.clientX + 14 + label.offsetWidth > innerWidth - 8;
    const x = flip ? e.clientX - 14 - label.offsetWidth : e.clientX + 14;
    label.style.transform = `translate(${x}px, ${e.clientY + 14}px)`;
  });

  // ---------- Layout ----------
  let vw, vh, cell, ox, oy, startSize, endSize;
  function layout() {
    vw = innerWidth;
    vh = innerHeight;
    // En desktop dejamos lugar a los costados para los textos.
    cell = Math.min((vh * 0.76) / gridH, (vw * (vw > 720 ? 0.5 : 0.86)) / gridW);
    ox = (vw - gridW * cell) / 2;
    oy = (vh - gridH * cell) / 2 + vh * 0.03;
    startSize = Math.max(40, Math.min(72, vw * 0.045));
    endSize = cell * (1 - GAP);
  }

  // ---------- Animación ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;

  let progress = reduceMotion ? 1 : 0;
  let smooth = progress;

  // En celular (o pantallas táctiles) no hace falta scrollear todo el recorrido:
  // con el primer gesto hacia abajo la flor se arma sola, en AUTO_DURATION ms.
  const AUTO_DURATION = 1600;
  const autoPlay = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
  let autoStart = null;
  const startAuto = () => { if (autoStart === null) autoStart = performance.now(); };
  if (autoPlay) {
    addEventListener("touchmove", startAuto, { passive: true });
    addEventListener("wheel", (e) => e.deltaY > 0 && startAuto(), { passive: true });
  }

  function readScroll() {
    if (reduceMotion) { progress = 1; return; }
    if (autoPlay) { if (scrollY > 4) startAuto(); return; }
    const max = landing.offsetHeight - innerHeight;
    progress = clamp(scrollY / max);
  }

  function frame(time) {
    if (autoPlay && autoStart !== null && !reduceMotion) progress = clamp((time - autoStart) / AUTO_DURATION);
    smooth = lerp(smooth, progress, 0.12);
    const p = smooth;
    const s = time / 1000;

    hint.style.opacity = 1 - clamp(p / 0.05);

    // Cuando la flor está armada, se mece como con viento: el tallo queda
    // fijo en la base y la cabeza se mueve más.
    const hold = clamp((p - 0.6) / 0.25);
    if (p > 0.55) deco.release(0.5);
    const wind = (Math.sin(s * 0.7) * 0.6 + Math.sin(s * 1.9) * 0.15) * 0.06 * hold;
    const bx = ox + (base[0] + 0.5) * cell;
    const by = oy + (base[1] + 1) * cell;

    for (const t of tiles) {
      const local = ease(clamp((p - 0.08 - t.delay * 0.3) / 0.4));
      const driftX = Math.cos(s * 0.4 + t.drift) * 10 * (1 - local);
      const driftY = Math.sin(s * 0.5 + t.drift) * 10 * (1 - local);
      const sx = lerp(vw * 0.06, vw * 0.94, t.start[0]);
      const sy = lerp(vh * 0.12, vh * 0.88, t.start[1]);
      // Destino: el pixel, rotado alrededor de la base según su altura.
      let ex = ox + (t.target[0] + 0.5) * cell;
      let ey = oy + (t.target[1] + 0.5) * cell;
      const bend = wind * Math.pow((by - ey) / (gridH * cell), 1.4);
      const dx = ex - bx, dy = ey - by;
      ex = bx + dx * Math.cos(bend) - dy * Math.sin(bend);
      ey = by + dx * Math.sin(bend) + dy * Math.cos(bend);
      const w = lerp(startSize * t.startScale, endSize, local);
      const x = lerp(sx, ex, local) + driftX;
      const y = lerp(sy, ey, local) + driftY;
      t.el.style.width = `${w}px`;
      t.el.style.opacity = t.intro ? 1 : clamp(local * 3);
      t.el.style.setProperty("--tint-o", local);
      t.el.style.transform = `translate3d(${x - w / 2}px, ${y - w / 2}px, 0) rotate(${bend * local}rad)`;
    }
    requestAnimationFrame(frame);
  }

  addEventListener("resize", layout);
  addEventListener("scroll", readScroll, { passive: true });
  layout();
  readScroll();
  smooth = progress;
  frame(performance.now());
})();
