#!/usr/bin/env python3
"""
Build variations of the all-white MLG Teams background
(base: mlg-teams-bg-allwhite-1920x1080.png — white logo, white service
text, white square bullets, no slogan; its background is the flipped
'background blue.jpg' — clean gradient on the LEFT, mesh on the RIGHT).

Variations produced:
  1) mlg-teams-bg-white-lines-1920x1080.png
     Services separated by thin horizontal lines (no square bullets).
  2) mlg-teams-bg-navy-1920x1080.png
     Whole content recoloured to #040e1a (dark navy); square bullets.
  3) mlg-teams-bg-white-twoline-1920x1080.png
     Each service on two lines (name + tagline), divided by lines.

Run:
  DYLD_LIBRARY_PATH=/opt/homebrew/lib python3 scripts/build_teams_bg_variations.py
"""
import pathlib
from PIL import Image, ImageFont, ImageDraw

DIR  = pathlib.Path(__file__).resolve().parent.parent / "assets/teams-backgrounds"
BASE = DIR / "mlg-teams-bg-allwhite-1920x1080.png"
RAW  = DIR / "background blue.jpg"

NAVY = (4, 14, 26)
ITEM_MID = [358, 400, 442, 484]                 # existing bullet-row centres
LINE_Y   = [379, 421, 463]                       # midpoints between items

FONT = "/System/Library/Fonts/Helvetica.ttc"
def font(pt, bold=False):
    return ImageFont.truetype(FONT, pt, index=1 if bold else 0)

SERVICES = [
    ("Leadership Development", "From potential to organizational performance"),
    ("Coaching & Sparring",    "The fast lane to best performance"),
    ("Audits & Assessments",   "Everyone in the perfect place"),
    ("Cultural Transformation","Getting everyone engaged"),
]

def clean_bg():
    return Image.open(RAW).convert("RGB").resize((1920, 1080), Image.LANCZOS).transpose(Image.FLIP_LEFT_RIGHT)

def blend(o, t, a):
    return tuple(round(o[i] * (1 - a) + t[i] * a) for i in range(3))

# ── 1) lines ────────────────────────────────────────────────────────
def build_lines():
    im = Image.open(BASE).convert("RGB"); px = im.load()
    bg = clean_bg().load()
    for y in range(344, 496):                    # erase square column -> clean bg
        for x in range(122, 151):
            px[x, y] = bg[x, y]
    for ly in LINE_Y:                            # faint white dividers
        for x in range(132, 372):
            for yy in (ly, ly + 1):
                px[x, yy] = blend(px[x, yy], (255, 255, 255), 0.5)
    im.save(DIR / "mlg-teams-bg-white-lines-1920x1080.png", "PNG", optimize=True)
    print("✓ white-lines")

# ── 2) navy ─────────────────────────────────────────────────────────
def build_navy():
    im = Image.open(BASE).convert("RGB"); px = im.load()
    for (x0, y0, x1, y1) in [(108, 130, 780, 285), (108, 338, 565, 500)]:
        for y in range(y0, y1):
            for x in range(x0, x1):
                m = min(px[x, y])
                if m > 205:
                    px[x, y] = blend(px[x, y], NAVY, min(1.0, (m - 205) / 50.0))
    # Smooth the faint light blob in the (content-free) upper-centre area so
    # it doesn't read as a light box next to the dark navy content.
    xa, xb = 498, 884
    for y in range(92, 314):
        ca, cb = px[xa, y], px[xb, y]
        for x in range(xa + 1, xb):
            t = (x - xa) / (xb - xa)
            px[x, y] = tuple(round(ca[i] + (cb[i] - ca[i]) * t) for i in range(3))
    im.save(DIR / "mlg-teams-bg-navy-1920x1080.png", "PNG", optimize=True)
    print("✓ navy")

# ── 3) each service name broken across two lines, divided by lines ──
#     (existing bullet-list text only — NO added copy)
SPLITS = [
    ("Leadership", "Development"),
    ("Coaching &", "Sparring"),
    ("Audits &", "Assessments"),
    ("Cultural", "Transformation"),
]
def build_twoline():
    im = Image.open(BASE).convert("RGB"); px = im.load()
    bg = clean_bg().load()
    for y in range(340, 570):                     # erase existing service block
        for x in range(120, 470):
            px[x, y] = bg[x, y]
    d = ImageDraw.Draw(im)
    name_f = font(21, bold=False)
    x = 132
    top0, pitch, lh = 346, 60, 23
    WHITE = (255, 255, 255)
    for i, (l1, l2) in enumerate(SPLITS):
        top = top0 + i * pitch
        d.text((x, top), l1, font=name_f, fill=WHITE)
        d.text((x, top + lh), l2, font=name_f, fill=WHITE)
        if i < len(SPLITS) - 1:                   # divider between items
            ly = top + pitch - 8
            for xx in range(x, 470):
                for yy in (ly, ly + 1):
                    im.putpixel((xx, yy), blend(im.getpixel((xx, yy)), (255, 255, 255), 0.4))
    im.save(DIR / "mlg-teams-bg-white-twoline-1920x1080.png", "PNG", optimize=True)
    print("✓ white-twoline (2-line names + dividers)")

if __name__ == "__main__":
    build_lines()
    build_navy()
    build_twoline()
