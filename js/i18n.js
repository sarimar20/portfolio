// Idioma del sitio: español por defecto, inglés opcional (se recuerda en el navegador).
// Textos fijos: elementos con data-i18n="clave" (se reemplaza su HTML).
// Textos de Behance con "[ES] … [EN] …": I18N.pick(texto) devuelve la parte del idioma actual.
window.I18N = (function () {
  let lang = "es";
  try {
    if (localStorage.getItem("lang") === "en") lang = "en";
  } catch (e) {}
  document.documentElement.lang = lang;

  const STRINGS = {
    "nav.home": ["Inicio", "Home"],
    "nav.projects": ["Proyectos", "Projects"],
    "nav.about": ["Sobre mi", "About"],
    "landing.work": ["acá mis<br>trabajos", "here's my<br>work"],
    "landing.hint": ["scrolleá para ver más :)", "scroll to see more :)"],
    "projects.title": ["Proyectos", "Projects"],
    "project.prev": ["Anterior", "Previous"],
    "project.next": ["Siguiente", "Next"],
    "about.label": ["Sobre mi", "About me"],
    "about.bio": [
      "<p>Me gusta mucho mirar cosas. Le saco fotos a casi todo. A lo que tengo cerca, a lo que pasa todos los días.</p>" +
      "<p>Me interesa la cultura argentina en todas sus expresiones. La farándula, sobre todo. También la música y las pelis.</p>" +
      "<p>Soy diseñadora gráfica. Estudié en FADU, vivo en Buenos Aires. Trabajo en identidad y en redes, me interesa lo editorial y me gusta meterme en cosas que todavía no conozco.</p>",
      "<p>I really like looking at things. I take pictures of almost everything. Whatever is close to me, whatever happens every day.</p>" +
      "<p>I'm interested in Argentine culture in all its forms. Showbiz gossip, above all. Music and movies too.</p>" +
      "<p>I'm a graphic designer. I studied at FADU and I live in Buenos Aires. I work on identity and social media, I'm into editorial design and I like getting into things I don't know yet.</p>",
    ],
    "about.freelance": ["Tomo proyectos freelance. ¡Escribime!", "Available for freelance projects. Get in touch!"],
    "footer.contact": ["Contactame :)", "Contact me :)"],
    "footer.top": ["Volver arriba", "Back to top"],
  };

  // Áreas de Behance (vienen en español).
  const FIELDS = {
    "Diseño gráfico": "Graphic design",
    "Diseño editorial": "Editorial design",
    "Arquitectura de información": "Information architecture",
    "Diseño web": "Web design",
    "Interfaz y exp. de usuario": "UI/UX",
    "Marcas": "Branding",
    "Diseño de logotipos": "Logo design",
    "Fotografía": "Photography",
    "Ilustración": "Illustration",
  };

  const t = (key) => (STRINGS[key] ? STRINGS[key][lang === "en" ? 1 : 0] : key);
  const field = (name) => (lang === "en" && FIELDS[name]) || name;

  function pick(text) {
    const parts = {};
    text.split(/\s*(?=\[(?:ES|EN)\])/).forEach((chunk) => {
      const m = chunk.match(/^\[(ES|EN)\]\s*/);
      if (m) parts[m[1].toLowerCase()] = chunk.slice(m[0].length).trim();
    });
    if (!parts.es && !parts.en) return text;
    return parts[lang] || parts.es || parts.en;
  }

  function apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => (el.innerHTML = t(el.dataset.i18n)));
  }

  function set(next) {
    try {
      localStorage.setItem("lang", next);
    } catch (e) {}
    location.reload();
  }

  return { lang, t, field, pick, apply, set };
})();
