#!/usr/bin/env python3
"""
Build two variations of the all-white MLG Teams background
(mlg-teams-bg-allwhite-1920x1080.png as the base — white logo, white
service text, white square bullets, no slogan):

  1) mlg-teams-bg-white-lines-1920x1080.png
     Service items separated by thin horizontal lines instead of the
     square bullet markers (bullets removed, dividers added).

  2) mlg-teams-bg-navy-1920x1080.png
     The whole content (logo, service text, bullets) recoloured to
     #040e1a (dark navy) — everything else unchanged.

Run:
  python3 scripts/build_teams_bg_variations.py
"""
import pathlib
from PIL import Image

DIR  = pathlib.Path(__file__).resolve().parent.parent / "assets/teams-backgrounds"
BASE = DIR / "mlg-teams-bg-allwhite-1920x1080.png"

# Service item text bboxes (measured): rows at these y-centres
ITEM_MID = [358, 400, 442, 484]
LINE_Y   = [379, 421, 463]          # midpoints between consecutive items
NAVY     = (4, 14, 26)              # #040e1a

def load():
    return Image.open(BASE).convert("RGB")

def erase_square_strip(px):
    """Remove the white square bullets by horizontally interpolating the
    clean background across the marker column (x123..151)."""
    x0, x1 = 123, 151
    for y in range(344, 496):
        ca, cb = px[x0, y], px[x1, y]
        for x in range(x0 + 1, x1):
            t = (x - x0) / (x1 - x0)
            px[x, y] = tuple(round(ca[i] + (cb[i] - ca[i]) * t) for i in range(3))

def blend(orig, target, a):
    return tuple(round(orig[i] * (1 - a) + target[i] * a) for i in range(3))

def smooth_patch(px):
    """Smooth out a faint pre-existing darker rectangle in the bg to the
    right of the logo mark (clear of any content), via vertical interp."""
    y0, y1 = 134, 242
    for x in range(472, 584):
        ca, cb = px[x, y0], px[x, y1]
        for y in range(y0 + 1, y1):
            t = (y - y0) / (y1 - y0)
            px[x, y] = tuple(round(ca[i] + (cb[i] - ca[i]) * t) for i in range(3))

def build_lines():
    im = load(); px = im.load()
    erase_square_strip(px)
    # thin divider lines between items — faint white, matches the text
    for ly in LINE_Y:
        for x in range(132, 372):
            for yy in (ly, ly + 1):
                px[x, yy] = blend(px[x, yy], (255, 255, 255), 0.5)
    out = DIR / "mlg-teams-bg-white-lines-1920x1080.png"
    im.save(out, "PNG", optimize=True); print("✓", out.name)

def build_navy():
    im = load(); px = im.load()
    # Recolour bright (white) content -> navy in the left content regions.
    regions = [(110, 130, 780, 240), (110, 340, 560, 500)]  # logo box, service box
    for (x0, y0, x1, y1) in regions:
        for y in range(y0, y1):
            for x in range(x0, x1):
                r, g, b = px[x, y]
                # White content has a high MIN channel; the bluish bg has a
                # low R channel — so min() cleanly separates content from bg.
                m = min(r, g, b)
                if m > 205:
                    a = min(1.0, (m - 205) / 50.0)
                    px[x, y] = blend((r, g, b), NAVY, a)
    out = DIR / "mlg-teams-bg-navy-1920x1080.png"
    im.save(out, "PNG", optimize=True); print("✓", out.name)

if __name__ == "__main__":
    build_lines()
    build_navy()
