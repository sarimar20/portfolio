"""Convierte un SVG de punto cruz (cada puntada = una X en una grilla de 10px)
en js/flower-data.js. Uso: python3 scripts/flower.py ruta/al/archivo.svg"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
svg = open(sys.argv[1]).read()
cells = {((int(x) - 3) // 10, (int(y) - 3) // 10)
         for x, y in re.findall(r"M(\d+) (\d+)L\d+ \d+M\d+ \d+L", svg)}
minx, miny = min(c[0] for c in cells), min(c[1] for c in cells)
w = max(c[0] for c in cells) - minx + 1
h = max(c[1] for c in cells) - miny + 1
rows = ["".join("#" if (x + minx, y + miny) in cells else "." for x in range(w)) for y in range(h)]
with open(os.path.join(ROOT, "js/flower-data.js"), "w") as f:
    f.write("// Generado por scripts/flower.py — cada '#' es una puntada.\nwindow.FLOWER = ")
    json.dump(rows, f, indent=0)
    f.write(";\n")
print(f"{len(cells)} puntadas, grilla {w}x{h}")
