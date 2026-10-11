"""Convierte una imagen pixel art (fondo claro) en js/flower-data.js.
Cada pixel de la ilustración = una miniatura en la landing.

Uso: python3 scripts/flower_from_image.py imagen.jpg COLUMNAS FILAS
     (COLUMNAS x FILAS = cantidad de pixels del dibujo, ej. 16 18)

Cada celda se guarda con una letra según su color: r (rojo), g (verde),
k (otro color) o '.' (vacío)."""
import json, os, struct, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src, cols, rows = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])

bmp = os.path.join(tempfile.mkdtemp(), "flower.bmp")
subprocess.run(["sips", "-s", "format", "bmp", src, "--out", bmp], check=True, capture_output=True)
b = open(bmp, "rb").read()
off = struct.unpack_from("<I", b, 10)[0]
w, h = struct.unpack_from("<ii", b, 18)
bottom_up, h = h > 0, abs(h)
stride = (w * 3 + 3) & ~3


def px(x, y):
    i = off + (h - 1 - y if bottom_up else y) * stride + x * 3
    return b[i + 2], b[i + 1], b[i]


def kind(c):
    r, g, bl = c
    if max(c) - min(c) < 40 and min(c) > 180:
        return "."  # fondo
    if r > 150 and g < 90:
        return "r"
    if g > 60 and r < 90 and bl < 90:
        return "g"
    return "k"


# Recorte al dibujo.
ink = [(x, y) for y in range(0, h, 2) for x in range(0, w, 2) if kind(px(x, y)) != "."]
x0, x1 = min(p[0] for p in ink), max(p[0] for p in ink) + 2
y0, y1 = min(p[1] for p in ink), max(p[1] for p in ink) + 2
cw, ch = (x1 - x0) / cols, (y1 - y0) / rows

grid = []
for r in range(rows):
    line = ""
    for c in range(cols):
        votes = {}
        for dx in (-0.2, 0, 0.2):
            for dy in (-0.2, 0, 0.2):
                k = kind(px(int(x0 + (c + 0.5 + dx) * cw), int(y0 + (r + 0.5 + dy) * ch)))
                votes[k] = votes.get(k, 0) + 1
        line += max(votes, key=votes.get)
    grid.append(line)

with open(os.path.join(ROOT, "js/flower-data.js"), "w") as f:
    f.write("// Generado por scripts/flower_from_image.py — cada letra es un pixel (r rojo, g verde, k otro).\n")
    f.write("window.FLOWER = ")
    json.dump(grid, f, indent=0)
    f.write(";\n")
print("\n".join(grid))
print(sum(len(l) - l.count(".") for l in grid), "pixels")
