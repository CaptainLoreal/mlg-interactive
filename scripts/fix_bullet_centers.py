#!/usr/bin/env python3
"""
Re-center bullet dots vertically on their text lines.
Dots are currently aligned to the text TOP; shift down ~6px to center on glyph.

Run:
  DYLD_LIBRARY_PATH=/opt/homebrew/lib python3 scripts/fix_bullet_centers.py
"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Current dot measurements (center_x, center_y), radius, color
DOT_CX    = 134
DOT_R     = 5          # slightly larger than measured ~4.5 to keep crisp circle
DOT_COLOR = (179, 10, 49, 255)
OLD_DOT_CY = [360, 402, 444, 486]   # current centers after previous +6 shift
SHIFT      = -3        # move back up 3px — 6 was too low, original was too high
NEW_DOT_CY = [y + SHIFT for y in OLD_DOT_CY]

ERASE_PAD = DOT_R + 3  # extra px around old dot to fully clear anti-aliased edges

FILES = [
    ROOT / "assets/teams-backgrounds/mlg-teams-bg-white-1920x1080.png",
    ROOT / "assets/teams-backgrounds/mlg-teams-bg-white-red-1920x1080.png",
]

def reconstruct_bg(base, cx, cy, pad):
    """Fill a small square around (cx,cy) by interpolating rows above/below."""
    x0, y0 = cx - pad, cy - pad
    x1, y1 = cx + pad, cy + pad
    w, h = x1 - x0, y1 - y0

    top_row    = base.crop((x0, y0 - 4, x1, y0)).resize((w, 1), Image.LANCZOS)
    bottom_row = base.crop((x0, y1,     x1, y1 + 4)).resize((w, 1), Image.LANCZOS)
    tp = top_row.load()
    bp = bottom_row.load()

    patch = Image.new("RGB", (w, h))
    pp = patch.load()
    for y in range(h):
        t = y / max(1, h - 1)
        for x in range(w):
            ta, ba = tp[x, 0], bp[x, 0]
            pp[x, y] = (
                int(ta[0] * (1 - t) + ba[0] * t),
                int(ta[1] * (1 - t) + ba[1] * t),
                int(ta[2] * (1 - t) + ba[2] * t),
            )
    patch = patch.filter(ImageFilter.GaussianBlur(radius=0.5)).convert("RGBA")
    base.paste(patch, (x0, y0))

def process(path):
    img = Image.open(path).convert("RGBA")
    draw = ImageDraw.Draw(img)

    for old_cy, new_cy in zip(OLD_DOT_CY, NEW_DOT_CY):
        # 1. Erase old dot by reconstructing background
        reconstruct_bg(img, DOT_CX, old_cy, ERASE_PAD)

        # 2. Draw new dot at corrected center
        draw = ImageDraw.Draw(img)
        r = DOT_R
        draw.ellipse(
            (DOT_CX - r, new_cy - r, DOT_CX + r, new_cy + r),
            fill=DOT_COLOR,
        )

    img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"✓ fixed {path.name}")

for f in FILES:
    process(f)
