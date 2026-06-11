#!/usr/bin/env python3
"""
Rebuild the MLG Teams meeting-background (1920×1080).

Layout:
  • Background: assets/teams-backgrounds/background blue.jpg (resized to 1920×1080)
  • Top-left:   MLG logo (logo-black.svg) — sized so its right edge is
                flush with the right edge of the subtitle "... EMPOWERING LEADERSHIP"
                rendered directly below it.
  • Subtitle:   "... EMPOWERING LEADERSHIP" in spaced caps, red dots,
                anchored to share right edge with the logo above.
  • Bullets:    four red-square + service-name lines (Leadership Development,
                Coaching & Sparring, Audits & Assessments, Cultural Transformation)

Output: site/assets/teams-backgrounds/mlg-teams-background-blue-1920x1080.png

Run:
  DYLD_LIBRARY_PATH=/opt/homebrew/lib python3 scripts/build_teams_bg.py
"""
import io, os, sys, pathlib
from PIL import Image, ImageDraw, ImageFont
import cairosvg

ROOT       = pathlib.Path(__file__).resolve().parent.parent
BG_PATH    = ROOT / "assets/teams-backgrounds/background blue.jpg"
LOGO_PATH  = ROOT / "assets/logo-black.svg"
OUT_PATH   = ROOT / "assets/teams-backgrounds/mlg-teams-background-blue-1920x1080.png"

W, H       = 1920, 1080
MARGIN_X   = 110
MARGIN_Y   = 110

# Subtitle text and styling — sized so the matching logo is genuinely
# smaller than the previous render (was ~280 px wide).
SUBTITLE   = "...  EMPOWERING LEADERSHIP"            # three dots, then the original phrase
SUBTITLE_FONT_SIZE_PT = 11                            # small caps under logo
SUBTITLE_LETTER_SPACE = 2                             # extra px between every glyph (tracking)

# Bullet items
BULLETS = [
    "Leadership Development",
    "Coaching & Sparring",
    "Audits & Assessments",
    "Cultural Transformation",
]
BULLET_FONT_SIZE_PT = 26
BULLET_GAP          = 22
BULLET_DOT_SIZE     = 12
BULLET_DOT_GAP      = 18

RED        = (181, 0, 52, 255)
BLACK      = (10, 10, 10, 255)

# ── Font resolution ────────────────────────────────────────────────
def find_font(prefs):
    """Return the first existing TTF/OTF path from a list of preferences."""
    for p in prefs:
        if pathlib.Path(p).exists():
            return p
    return None

# Helvetica Neue (semibold-ish) for subtitle/bullets — fall back to plain Helvetica or Arial
FONT_SUBTITLE = find_font([
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
])
FONT_BULLET = FONT_SUBTITLE
if FONT_SUBTITLE is None:
    sys.exit("No usable system font found — install Helvetica or Arial.")

# ── Helpers ────────────────────────────────────────────────────────
def render_svg_to_png(svg_path, width_px):
    """Rasterize an SVG at a given output width, return a PIL Image (RGBA)."""
    png_bytes = cairosvg.svg2png(url=str(svg_path), output_width=width_px)
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")

def render_spaced_text(text, font, fill, letter_space):
    """
    Render `text` with extra px of tracking between every glyph.
    Returns (PIL.Image RGBA, width, height).
    """
    # Pre-measure each glyph
    tmp = Image.new("RGBA", (1, 1))
    d = ImageDraw.Draw(tmp)
    widths = []
    for ch in text:
        bbox = d.textbbox((0, 0), ch, font=font)
        widths.append(bbox[2] - bbox[0])
    # Subtitle full width = sum(glyph widths) + (len-1)*letter_space
    total_w = sum(widths) + max(0, len(text) - 1) * letter_space
    # Use font ascent + descent for canvas height
    ascent, descent = font.getmetrics()
    total_h = ascent + descent

    img = Image.new("RGBA", (total_w + 4, total_h + 4), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    x = 0
    for ch, w in zip(text, widths):
        draw.text((x, 0), ch, font=font, fill=fill)
        x += w + letter_space
    return img, total_w, total_h

# ── Build ──────────────────────────────────────────────────────────
def main():
    # 1. Background — resize to 1920×1080
    bg = Image.open(BG_PATH).convert("RGBA").resize((W, H), Image.LANCZOS)

    # 2. Render subtitle to measure its width first
    sub_font = ImageFont.truetype(FONT_SUBTITLE, SUBTITLE_FONT_SIZE_PT)
    sub_img, sub_w, sub_h = render_spaced_text(
        SUBTITLE, sub_font, BLACK, SUBTITLE_LETTER_SPACE
    )

    # 3. Logo width = subtitle width (user request: logo finishes flush right
    #    with subtitle below it)
    logo_target_w = sub_w
    logo = render_svg_to_png(LOGO_PATH, logo_target_w)
    logo_w, logo_h = logo.size

    # 4. Place logo at top-left margin
    logo_x = MARGIN_X
    logo_y = MARGIN_Y
    bg.paste(logo, (logo_x, logo_y), logo)

    # 5. Subtitle: positioned directly below logo, right edge aligned to logo
    sub_x = logo_x + logo_w - sub_w
    sub_y = logo_y + logo_h + 18
    bg.paste(sub_img, (sub_x, sub_y), sub_img)

    # 6. Bullets — below subtitle, left-aligned to logo
    bullet_y = sub_y + sub_h + 90
    bullet_font = ImageFont.truetype(FONT_BULLET, BULLET_FONT_SIZE_PT)

    bullet_draw = ImageDraw.Draw(bg)
    for i, text in enumerate(BULLETS):
        # Red square
        y = bullet_y + i * (BULLET_FONT_SIZE_PT + BULLET_GAP)
        # Vertical-centered square against the text cap height
        ascent, _ = bullet_font.getmetrics()
        sq_y = y + (ascent - BULLET_DOT_SIZE) // 2 + 2
        bullet_draw.rectangle(
            [logo_x, sq_y, logo_x + BULLET_DOT_SIZE, sq_y + BULLET_DOT_SIZE],
            fill=RED,
        )
        bullet_draw.text(
            (logo_x + BULLET_DOT_SIZE + BULLET_DOT_GAP, y),
            text, font=bullet_font, fill=BLACK,
        )

    # 7. Save
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    bg.convert("RGB").save(OUT_PATH, "PNG", optimize=True)
    print(f"✓ wrote {OUT_PATH} ({W}×{H})")
    print(f"   logo width: {logo_w}px (matches subtitle width)")
    print(f"   subtitle width: {sub_w}px")

if __name__ == "__main__":
    main()
