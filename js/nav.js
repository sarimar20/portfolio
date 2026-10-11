// Nav compartida por todas las páginas (necesita js/i18n.js antes).
(function () {
  const { t, lang } = window.I18N;
  const page = document.body.dataset.page;
  const links = [
    ["index", "index.html", t("nav.home")],
    ["proyectos", "proyectos.html", t("nav.projects")],
    ["about", "about.html", t("nav.about")],
  ];
  const nav = document.createElement("header");
  nav.className = "nav";
  nav.innerHTML =
    '<a class="nav__logo" href="index.html">Sari M</a>' +
    '<div class="nav__right">' +
    '<nav class="nav__links">' +
    links
      .map(
        ([id, href, label], i) =>
          `<a href="${href}"${id === page ? ' aria-current="page"' : ""}>${label}<sup>${i + 1}</sup></a>`
      )
      .join("") +
    "</nav>" +
    // Selector de idioma: ES / EN
    `<div class="lang" role="group" aria-label="Idioma / Language">` +
    ["es", "en"]
      .map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === lang}">${l.toUpperCase()}</button>`)
      .join('<span aria-hidden="true">/</span>') +
    "</div></div>";
  nav.querySelectorAll("[data-lang]").forEach((b) =>
    b.addEventListener("click", () => b.dataset.lang !== lang && window.I18N.set(b.dataset.lang))
  );
  document.body.prepend(nav);
  window.I18N.apply();

  // Cuánto falta desde el final de los links (antes de ES / EN) hasta el borde
  // derecho: el texto del proyecto termina alineado ahí.
  const linksEl = nav.querySelector(".nav__links");
  const setInset = () =>
    document.documentElement.style.setProperty("--links-inset", `${innerWidth - linksEl.getBoundingClientRect().right}px`);
  setInset();
  addEventListener("resize", setInset);
  if (document.fonts) document.fonts.ready.then(setInset);
})();
