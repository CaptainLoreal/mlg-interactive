#!/usr/bin/env python3
"""
Build a set of LinkedIn-banner variations (1584×396 + @2x 3168×792).

Each variation uses a DIFFERENT source photo from assets/photos/ and
keeps a consistent layout:
  • MLG logo (white) — top-left
  • "EMPOWERING LEADERSHIP" — big white headline
  • "Developing leaders who shape organizations" — small tagline below
  • Source photo as background, with a dark gradient on the LEFT third
    so the text stays legible regardless of what's behind it.

Output files (per source photo `<slug>.webp`):
  assets/linkedin/mlg-linkedin-<slug>.png         (1584×396)
  assets/linkedin/mlg-linkedin-<slug>@2x.png      (3168×792)

Run:
  DYLD_LIBRARY_PATH=/opt/homebrew/lib python3 scripts/build_linkedin_banners.py
"""
import io, pathlib, sys
from PIL import Image, ImageDraw, ImageFont
import cairosvg

ROOT       = pathlib.Path(__file__).resolve().parent.parent
PHOTO_DIR  = ROOT / "assets/photos"
LOGO_PATH  = ROOT / "assets/logo-white-bold.svg"
OUT_DIR    = ROOT / "assets/linkedin"

# Variations to render (source photo slug → output slug)
VARIATIONS = [
    ("working-1.webp",  "working1"),
    ("working-2.webp",  "working2"),
    ("working-3.webp",  "working3"),
    ("working-4.webp",  "working4"),
    ("group-1.webp",    "group1"),
    ("group-2.webp",    "group2"),
    ("group-3.webp",    "group3"),
    ("red-10.webp",     "red10"),
]

# Output dimensions
W, H = 1584, 396
SCALE2X = 2

# Layout (1× coordinates — scaled up for 2× automatically)
# Content sits on the RIGHT half — photo fills the LEFT half. The dark
# gradient now fades from transparent (left) → dark (right) so the text
# is legible on the right side of the banner.
MARGIN_R    = 70                       # right padding for text/logo
MARGIN_T    = 30                       # top padding
LOGO_W      = 130                      # logo width
HEADLINE_PT = 64                       # "EMPOWERING LEADERSHIP" font size
TAGLINE_PT  = 18                       # "Developing leaders…" font size
HEADLINE_Y  = 130                      # y of headline (px from top)
TAGLINE_Y   = HEADLINE_Y + HEADLINE_PT*2 + 24
GRADIENT_W  = 900                      # width of dark gradient overlay (from RIGHT edge)

HEADLINE   = "EMPOWERING\nLEADERSHIP"
TAGLINE    = "Developing leaders who shape organizations"
WHITE      = (255, 255, 255, 255)
TAGLINE_FG = (255, 255, 255, 220)

def find_font(prefs):
    for p in prefs:
        if pathlib.Path(p).exists(): return p
    return None

FONT_BOLD = find_font([
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
])
FONT_REG = find_font([
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
])
if not FONT_BOLD or not FONT_REG: sys.exit("Need Helvetica/Arial.")

def render_svg(svg_path, width_px):
    png = cairosvg.svg2png(url=str(svg_path), output_width=width_px)
    return Image.open(io.BytesIO(png)).convert("RGBA")

def cover_crop(img, target_w, target_h):
    """Scale + centre-crop `img` to exactly target dimensions (object-fit: cover)."""
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    nw, nh = int(src_w * scale), int(src_h * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - target_w) // 2
    top  = (nh - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))

def build_banner(photo_path: pathlib.Path, scale: int = 1) -> Image.Image:
    """Render one banner at the given scale (1× = 1584×396, 2× = 3168×792)."""
    w, h = W * scale, H * scale
    base = Image.new("RGB", (w, h), (12, 14, 16))

    # 1. Background photo — cover-crop to banner size
    photo = Image.open(photo_path).convert("RGB")
    photo = cover_crop(photo, w, h)
    base.paste(photo, (0, 0))

    # 2. RIGHT-side dark gradient overlay for text legibility.
    #    Fade from transparent at the centre-line to dark at the right
    #    edge — keeps the photo on the left half clearly visible while
    #    giving the headline a solid background on the right.
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    grad_w = GRADIENT_W * scale
    for i in range(grad_w):
        # i=0 is the LEFT edge of the gradient (transparent),
        # i=grad_w-1 is the RIGHT edge (dark).
        alpha = int(190 * (i / grad_w) ** 1.2)
        x = w - grad_w + i
        gd.line([(x, 0), (x, h)], fill=(0, 0, 0, alpha))
    base.paste(grad, (0, 0), grad)

    # 3. MLG logo — TOP-RIGHT (mirror of the original top-left)
    logo = render_svg(LOGO_PATH, LOGO_W * scale)
    lw, lh = logo.size
    logo_x = w - MARGIN_R * scale - lw
    base.paste(logo, (logo_x, MARGIN_T * scale), logo)

    # 4. Headline "EMPOWERING LEADERSHIP" — right-aligned to the same
    #    edge as the logo
    headline_font = ImageFont.truetype(FONT_BOLD, HEADLINE_PT * scale)
    tagline_font  = ImageFont.truetype(FONT_REG, TAGLINE_PT * scale)
    draw = ImageDraw.Draw(base)
    # Measure widest line of the headline to right-align the block
    head_lines = HEADLINE.split("\n")
    head_widths = [draw.textbbox((0, 0), ln, font=headline_font)[2] for ln in head_lines]
    head_block_w = max(head_widths)
    head_x = w - MARGIN_R * scale - head_block_w
    draw.multiline_text(
        (head_x, HEADLINE_Y * scale),
        HEADLINE, font=headline_font, fill=WHITE,
        spacing=int(8 * scale),
    )
    # 5. Tagline — right-aligned to the same right margin
    tag_w = draw.textbbox((0, 0), TAGLINE, font=tagline_font)[2]
    draw.text(
        (w - MARGIN_R * scale - tag_w, TAGLINE_Y * scale),
        TAGLINE, font=tagline_font, fill=TAGLINE_FG,
    )
    return base

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src, slug in VARIATIONS:
        photo = PHOTO_DIR / src
        if not photo.exists():
            print(f"  skip {src} (missing)")
            continue
        # 1×
        b1 = build_banner(photo, scale=1)
        out1 = OUT_DIR / f"mlg-linkedin-{slug}.png"
        b1.save(out1, "PNG", optimize=True)
        # 2×
        b2 = build_banner(photo, scale=SCALE2X)
        out2 = OUT_DIR / f"mlg-linkedin-{slug}@2x.png"
        b2.save(out2, "PNG", optimize=True)
        print(f"✓ {slug:10s} ← {src}   ({out1.name} + @2x)")

if __name__ == "__main__":
    main()
