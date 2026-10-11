// Cositas flotantes (corazones, estrellas, strass): flotan, chocan entre sí
// y se corren cuando pasa el mouse; algunas pueden caer con gravedad. Uso:
//   const g = Gravity.mount(contenedor, { density: 1 });
//   g.release(0.5);  // la mitad deja de flotar y cae al piso
// Con { still: true } quedan quietas y solo se mueven cuando las empuja el mouse.
window.Gravity = (function () {
  const PIECES = [
    { src: "assets/deco/heart.svg", size: 30, count: 5 },
    { src: "assets/deco/star-1.svg", size: 30, count: 2 },
    { src: "assets/deco/star-2.svg", size: 30, count: 2 },
    { src: "assets/deco/star-3.svg", size: 30, count: 2 },
    { src: "assets/deco/star-4.svg", size: 30, count: 2 },
    { src: "assets/deco/rhinestone.png", size: 24, count: 6 },
  ];
  const GRAVITY = 2200; // px/s²
  const BOUNCE = 0.32;
  const MOUSE_RADIUS = 70;
  const MOUSE_PUSH = 900;

  function mount(container, opts = {}) {
    const density = opts.density ?? 1;
    const still = !!opts.still;
    const layer = document.createElement("div");
    layer.className = "gravity";
    container.appendChild(layer);

    const bodies = [];
    PIECES.forEach((p) => {
      for (let i = 0; i < Math.max(1, Math.round(p.count * density)); i++) {
        const el = new Image();
        el.src = p.src;
        el.alt = "";
        el.className = "gravity__piece";
        layer.appendChild(el);
        bodies.push({
          el, base: p.size, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, r: 0,
          floating: true,
          home: [0, 0],
          phase: Math.random() * Math.PI * 2,
          speed: 0.15 + Math.random() * 0.2,
        });
      }
    });
    bodies.sort(() => Math.random() - 0.5);

    let W = 0, H = 0, scale = 1;
    function resize() {
      W = layer.clientWidth;
      H = layer.clientHeight;
      scale = Math.min(1.35, Math.max(0.8, W / 1440));
      for (const b of bodies) {
        b.size = b.base * scale;
        b.r = b.size / 2;
        b.el.style.width = `${b.size}px`;
      }
    }

    const mouse = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0 };
    addEventListener("pointermove", (e) => {
      const rect = layer.getBoundingClientRect();
      const now = performance.now();
      const dt = Math.max(1, now - mouse.t) / 1000;
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      mouse.vx = (x - mouse.x) / dt;
      mouse.vy = (y - mouse.y) / dt;
      mouse.x = x;
      mouse.y = y;
      mouse.t = now;
    });
    document.addEventListener("pointerleave", () => (mouse.x = mouse.y = -1e4));

    // Arrancan repartidas por todo el contenedor, flotando.
    function scatter() {
      for (const b of bodies) {
        // Dejamos libre la franja de arriba, donde está la nav.
        const top = Math.min(80, H * 0.1);
        b.home = [b.r + Math.random() * (W - b.size), top + b.r + Math.random() * (H - top - b.size)];
        b.x = b.home[0];
        b.y = b.home[1];
        b.a = (Math.random() - 0.5) * 0.8;
      }
    }

    // Una parte de las piezas deja de flotar y cae.
    let released = false;
    function release(fraction = 1) {
      if (released) return;
      released = true;
      bodies.slice(0, Math.round(bodies.length * fraction)).forEach((b, i) => {
        setTimeout(() => {
          b.floating = false;
          b.va += (Math.random() - 0.5) * 4;
        }, i * 120);
      });
    }

    let time = 0;
    function step(dt) {
      time += dt;
      for (const b of bodies) {
        if (b.floating && still) {
          // Quietas: frenan rápido y se quedan donde las dejó el mouse.
          b.vx *= 0.94;
          b.vy *= 0.94;
          b.va *= 0.94;
        } else if (b.floating) {
          // Flota alrededor de un punto que se mueve lento; si el mouse
          // la empuja, vuelve de a poco.
          const hx = b.home[0] + Math.cos(time * b.speed + b.phase) * 40;
          const hy = b.home[1] + Math.sin(time * b.speed * 1.3 + b.phase) * 30;
          b.vx += (hx - b.x) * 0.8 * dt;
          b.vy += (hy - b.y) * 0.8 * dt;
          b.vx *= 0.985;
          b.vy *= 0.985;
          b.va += Math.sin(time * 0.7 + b.phase) * 0.02 * dt;
        } else {
          b.vy += GRAVITY * dt;
        }

        // El mouse empuja lo que tiene cerca.
        const dx = b.x - mouse.x, dy = b.y - mouse.y;
        const d = Math.hypot(dx, dy);
        const reach = MOUSE_RADIUS + b.r;
        if (d < reach && d > 0.01) {
          const f = (1 - d / reach) * MOUSE_PUSH;
          b.vx += (dx / d) * f * 0.06 + mouse.vx * 0.02;
          b.vy += (dy / d) * f * 0.06 + Math.min(0, mouse.vy) * 0.02;
          b.va += (dx > 0 ? 1 : -1) * 0.4;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.a += b.va * dt;
        b.vx *= 0.995;
        b.va *= 0.98;

        // Piso, techo y paredes.
        if (b.floating && b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * BOUNCE; }
        if (b.y > H - b.r) {
          b.y = H - b.r;
          b.vy = -b.vy * BOUNCE;
          if (Math.abs(b.vy) < 40) b.vy = 0;
          b.vx *= 0.9;
          if (!b.floating) b.va = b.vx / b.r; // rueda sobre el piso
        }
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * BOUNCE; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * BOUNCE; }
      }

      // Choques entre piezas (círculos).
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const min = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d;
          const overlap = (min - d) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) {
            const imp = (-(1 + BOUNCE) * rel) / 2;
            a.vx -= imp * nx; a.vy -= imp * ny;
            b.vx += imp * nx; b.vy += imp * ny;
          }
        }
      }
    }

    let last = performance.now();
    function frame(now) {
      // Pasos fijos para que la simulación sea estable aunque baje el framerate.
      let dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      while (dt > 0) {
        const s = Math.min(dt, 1 / 120);
        step(s);
        dt -= s;
      }
      for (const b of bodies) {
        b.el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0) rotate(${b.a}rad)`;
      }
      requestAnimationFrame(frame);
    }

    addEventListener("resize", () => {
      resize();
      scatter();
    });
    resize();
    scatter();
    frame(performance.now());
    return { release };
  }

  return { mount };
})();
