# Portfolio — Sara Martinez

Sitio estático (HTML + CSS + JS, sin build).

## Páginas
- `index.html` — landing: las miniaturas se arman en la flor al scrollear (`js/landing.js`).
- `proyectos.html` — grilla de proyectos; en hover aparece el nombre.
- `proyecto.html?p=<slug>` — detalle de cada proyecto (contenido traído de Behance).
- `about.html` — provisorio.

## Verlo en local
```bash
python3 -m http.server 5173
```
y abrir http://localhost:5173

## Cambiar la flor
La flor es pixel art: cada pixel del dibujo = una miniatura. Exportá una imagen (fondo claro, pixels de color) y corré:
```bash
python3 scripts/flower_from_image.py assets/flower-rose.jpg 16 18
```
donde `16 18` son las columnas y filas de pixels del dibujo. Conviene que tenga más o menos tantos pixels como imágenes hay (hoy 129).

## Contenido de Behance
- `data/behance-raw.json` — lo extraído de Behance (títulos, textos, tags, orden de imágenes).
- `scripts/download.py` — baja las imágenes a `assets/projects/<slug>/`, crea versiones web (`web/`) y miniaturas (`thumbs/`) y regenera `js/projects-data.js`.
