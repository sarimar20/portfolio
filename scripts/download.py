"""Descarga las imágenes de Behance (data/behance-raw.json) a assets/projects/<slug>/
y genera data/projects.json + js/projects-data.js con rutas locales."""
import json, os, struct, subprocess, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CDN = "https://mir-s3-cdn-cf.behance.net/project_modules/"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36"}


def fetch(path, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return True
    size, rest = path.split("/", 1)
    for s in dict.fromkeys([size, "1400", "max_1200"]):
        try:
            req = urllib.request.Request(CDN + s + "/" + rest, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
                f.write(r.read())
            return True
        except Exception as e:
            last = e
    print("  !! falló", path, last)
    return False


def web(src, dest):
    """Versión liviana para la web: JPG de hasta 2000px (los GIF se dejan tal cual)."""
    if not os.path.exists(dest):
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82",
                        "-Z", "2000", src, "--out", dest], capture_output=True)


def luminance(path):
    """Luminancia media (0 negro – 1 blanco) de una miniatura."""
    bmp = os.path.join(tempfile.gettempdir(), "lum.bmp")
    subprocess.run(["sips", "-s", "format", "bmp", "-Z", "64", path, "--out", bmp], capture_output=True)
    b = open(bmp, "rb").read()
    off = struct.unpack_from("<I", b, 10)[0]
    w, h = struct.unpack_from("<ii", b, 18)
    h = abs(h)
    stride = (w * 3 + 3) & ~3
    total = 0
    for y in range(h):
        for x in range(w):
            i = off + y * stride + x * 3
            total += 0.0722 * b[i] + 0.7152 * b[i + 1] + 0.2126 * b[i + 2]
    return round(total / (w * h * 255), 3)


def thumb(src, dest):
    """Miniatura de 480px (primer cuadro si es gif) para la landing y la grilla."""
    if not os.path.exists(dest):
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "78",
                        "-Z", "480", src, "--out", dest], capture_output=True)


projects = json.load(open(os.path.join(ROOT, "data/behance-raw.json")))
out = []
for p in projects:
    d = os.path.join(ROOT, "assets/projects", p["slug"])
    os.makedirs(os.path.join(d, "thumbs"), exist_ok=True)
    os.makedirs(os.path.join(d, "web"), exist_ok=True)
    print(p["slug"])
    n = 0
    blocks = []

    def local(path):
        global n
        n += 1
        ext = os.path.splitext(path)[1]
        name = f"{n:02d}{ext}"
        if not fetch(path, os.path.join(d, name)):
            return None
        thumb(os.path.join(d, name), os.path.join(d, "thumbs", f"{n:02d}.jpg"))
        src = f"assets/projects/{p['slug']}/{name}"
        if ext != ".gif":
            web(os.path.join(d, name), os.path.join(d, "web", f"{n:02d}.jpg"))
            src = f"assets/projects/{p['slug']}/web/{n:02d}.jpg"
        return {"src": src,
                "thumb": f"assets/projects/{p['slug']}/thumbs/{n:02d}.jpg",
                "lum": luminance(os.path.join(d, "thumbs", f"{n:02d}.jpg"))}

    for m in p["modules"]:
        if "i" in m:
            img = local(m["i"])
            if img: blocks.append({"type": "image", **img})
        elif "g" in m:
            imgs = [x for x in (local(g) for g in m["g"]) if x]
            blocks.append({"type": "grid", "images": imgs})
        elif "e" in m:
            blocks.append({"type": "embed", "src": m["e"]})
        elif "t" in m:
            blocks.append({"type": "text", "text": m["t"]})
    images = [b for b in blocks if b["type"] == "image"] + \
             [i for b in blocks if b["type"] == "grid" for i in b["images"]]
    cover_name = p["cover"].split("/")[-1]
    # portada: la imagen cuyo archivo de Behance coincide con el og:image
    cover = next((img for img, m in zip(images, [m for m in p["modules"] if "i" in m])
                  if m["i"].split("/")[-1] == cover_name), images[0] if images else None)
    out.append({k: p[k] for k in ("slug", "title", "url", "description", "fields", "tags")}
               | {"related": p.get("related"), "cover": cover, "blocks": blocks})

json.dump(out, open(os.path.join(ROOT, "data/projects.json"), "w"), ensure_ascii=False, indent=1)
with open(os.path.join(ROOT, "js/projects-data.js"), "w") as f:
    f.write("// Generado por scripts/download.py — no editar a mano.\nwindow.PROJECTS = ")
    json.dump(out, f, ensure_ascii=False)
    f.write(";\n")
print("listo:", sum(len(p["blocks"]) for p in out), "bloques")
