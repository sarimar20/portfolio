// Página Proyectos: grilla + filtros por área (overlay con pastillas grandes).
// El filtro elegido queda en la URL (?area=...) para poder compartirlo.
(function () {
  const { t, field } = window.I18N;
  const list = window.PROJECTS;
  const grid = document.getElementById("grid");
  const button = document.getElementById("filters-open");
  const active = document.getElementById("filters-active");
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // Áreas de todos los proyectos, de la más usada a la menos usada.
  const counts = new Map();
  list.forEach((p) => p.fields.forEach((f) => counts.set(f, (counts.get(f) || 0) + 1)));
  const areas = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a));

  let current = new URLSearchParams(location.search).get("area");
  if (current && !counts.has(current)) current = null;

  function render() {
    const shown = current ? list.filter((p) => p.fields.includes(current)) : list;
    grid.innerHTML = shown.map((p) => `
      <a class="card" href="proyecto.html?p=${p.slug}">
        <img src="${p.cover.thumb}" alt="" loading="lazy">
        <span class="card__name">${esc(p.title)}</span>
      </a>`).join("");
    active.hidden = !current;
    active.innerHTML = current ? `${esc(field(current))} <span aria-hidden="true">×</span>` : "";
    active.setAttribute("aria-label", current ? `${t("projects.clear")}: ${field(current)}` : "");
  }

  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "filters";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", t("projects.filters"));
  overlay.innerHTML = `
    <div class="filters__inner">
      <div class="filters__head">
        <p class="filters__title">${t("projects.title")}</p>
        <button type="button" class="filters__close">${t("projects.close")}</button>
      </div>
      <div class="filters__pills">
        <button type="button" class="filters__pill" data-area="">${t("projects.all")}</button>
        ${areas.map((a) => `<button type="button" class="filters__pill" data-area="${esc(a)}">${esc(field(a))}</button>`).join("")}
      </div>
    </div>`;
  document.body.appendChild(overlay);

  function open() {
    overlay.hidden = false;
    document.documentElement.classList.add("has-overlay");
    overlay.querySelectorAll(".filters__pill").forEach((b) =>
      b.setAttribute("aria-pressed", String((b.dataset.area || null) === current)));
    void overlay.offsetWidth; // fuerza el estado inicial para que el fundido se vea
    overlay.classList.add("is-open");
    overlay.querySelector(".filters__pill").focus({ preventScroll: true });
  }

  function close() {
    overlay.classList.remove("is-open");
    document.documentElement.classList.remove("has-overlay");
    setTimeout(() => (overlay.hidden = true), 250);
    button.focus({ preventScroll: true });
  }

  function choose(area) {
    current = area || null;
    const url = new URL(location.href);
    if (current) url.searchParams.set("area", current);
    else url.searchParams.delete("area");
    history.replaceState(null, "", url);
    render();
  }

  button.addEventListener("click", open);
  active.addEventListener("click", () => choose(null));
  overlay.querySelector(".filters__close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    const pill = e.target.closest(".filters__pill");
    if (pill) {
      choose(pill.dataset.area);
      close();
    } else if (!e.target.closest(".filters__head, .filters__pills")) {
      close(); // clic en el fondo
    }
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });

  render();
})();
