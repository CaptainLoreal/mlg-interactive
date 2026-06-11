#!/usr/bin/env python3
"""
Patch the MLG Teams background: shrink the WHITE logo + add "..." before
"EMPOWERING LEADERSHIP". Surgical edit on the EXISTING PNG so the
mesh pattern (right half), bullets (left column under the logo) and
overall composition stay exactly as they were — we only repaint the
top-left logo/title region and re-render new content there.

Output: site/assets/teams-backgrounds/mlg-teams-background-blue-1920x1080.png

Run:
  DYLD_LIBRARY_PATH=/opt/homebrew/lib python3 scripts/build_teams_bg.py
"""
import io, pathlib, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import cairosvg

ROOT      = pathlib.Path(__file__).resolve().parent.parent
PNG_PATH  = ROOT / "assets/teams-backgrounds/mlg-teams-background-blue-1920x1080.png"
LOGO_PATH = ROOT / "assets/logo-white-bold.svg"      # WHITE logo (matches existing colour)

# Tight bbox around the OLD logo + "EMPOWERING LEADERSHIP" subtitle.
# Measured from the live PNG: x=120-628, y=120-346. A few px of
# padding around it to ensure full erasure including anti-aliased edges.
PATCH_BOX = (115, 113, 635, 355)   # (left, top, right, bottom)

# New subtitle (with the three dots) and styling — smaller than original
# so the matching logo is also smaller than what was there before.
SUBTITLE  = "...   EMPOWERING  LEADERSHIP"
SUB_PT    = 16           # font size (px) — was 22; shrinks logo to ~300 px
SUB_TRACK = 4            # extra px between glyphs

# Logo placement (top-left of the rendered logo)
LOGO_X    = 130
LOGO_Y    = 140

WHITE     = (255, 255, 255, 255)

def find_font(prefs):
    for p in prefs:
        if pathlib.Path(p).exists(): return p
    return None

FONT_FILE = find_font([
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
])
if not FONT_FILE: sys.exit("No Helvetica/Arial found.")

def render_svg(svg_path, width_px):
    png_bytes = cairosvg.svg2png(url=str(svg_path), output_width=width_px)
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")

def render_spaced(text, font, fill, track):
    tmp = Image.new("RGBA", (1, 1))
    d   = ImageDraw.Draw(tmp)
    widths = [d.textbbox((0, 0), c, font=font)[2] for c in text]
    total_w = sum(widths) + max(0, len(text) - 1) * track
    asc, dsc = font.getmetrics()
    img = Image.new("RGBA", (total_w + 4, asc + dsc + 4), (0, 0, 0, 0))
    dd  = ImageDraw.Draw(img)
    x = 0
    for c, w in zip(text, widths):
        dd.text((x, 0), c, font=font, fill=fill)
        x += w + track
    return img, total_w, asc + dsc

def main():
    base = Image.open(PNG_PATH).convert("RGBA")

    # 1. Reconstruct the gradient inside the patch by INTERPOLATING two
    #    horizontal slices taken from the clean rows just above and
    #    just below the patch box. This preserves the natural
    #    left→right colour at every y, while linearly fading from the
    #    above-patch colour down to the below-patch colour. Result:
    #    the patch matches its surroundings on every edge.
    px, py, pr, pb = PATCH_BOX
    patch_w = pr - px
    patch_h = pb - py

    # Sample one horizontal row above and one below the patch box,
    # both spanning the patch's x range. Use a 6-row average per
    # sample to smooth out any local noise/JPEG artifacts.
    top_row    = base.crop((px, py - 8,  pr, py - 2)).resize((patch_w, 1), Image.LANCZOS)
    bottom_row = base.crop((px, pb + 2,  pr, pb + 8)).resize((patch_w, 1), Image.LANCZOS)
    top_px    = top_row.load()
    bottom_px = bottom_row.load()

    patch = Image.new("RGB", (patch_w, patch_h))
    patch_px = patch.load()
    for y in range(patch_h):
        t = y / max(1, patch_h - 1)              # 0 at top, 1 at bottom
        for x in range(patch_w):
            ta = top_px[x, 0]
            ba = bottom_px[x, 0]
            patch_px[x, y] = (
                int(ta[0] * (1 - t) + ba[0] * t),
                int(ta[1] * (1 - t) + ba[1] * t),
                int(ta[2] * (1 - t) + ba[2] * t),
            )
    patch = patch.filter(ImageFilter.GaussianBlur(radius=0.6)).convert("RGBA")
    base.paste(patch, (px, py))

    # 2. Render subtitle FIRST to measure its width — we'll size the
    #    logo to match (user request: logo finishes flush-right with
    #    subtitle text).
    sub_font = ImageFont.truetype(FONT_FILE, SUB_PT)
    sub_img, sub_w, sub_h = render_spaced(SUBTITLE, sub_font, WHITE, SUB_TRACK)

    # 3. Logo at exactly subtitle width
    logo = render_svg(LOGO_PATH, sub_w)
    lw, lh = logo.size

    # 4. Paste logo
    base.paste(logo, (LOGO_X, LOGO_Y), logo)

    # 5. Paste subtitle right-aligned to logo (same right edge)
    sub_x = LOGO_X + lw - sub_w
    sub_y = LOGO_Y + lh + 18
    base.paste(sub_img, (sub_x, sub_y), sub_img)

    # 6. Save
    base.convert("RGB").save(PNG_PATH, "PNG", optimize=True)
    print(f"✓ patched {PNG_PATH.name}")
    print(f"   logo: {lw}px wide × {lh}px tall  (matches subtitle width)")
    print(f"   subtitle: '{SUBTITLE}'  ({sub_w}px)")

if __name__ == "__main__":
    main()
