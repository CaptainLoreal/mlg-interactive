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

# Variations to render (source photo slug → output slug → optional layout override)
# When `layout` is omitted, the variation uses the default RIGHT-side layout.
# `layout="left-big"` flips content to the LEFT, scales the logo up,
# adds a symmetric dark gradient on BOTH sides, and resizes the tagline
# so its width matches the slogan's widest line.
VARIATIONS = [
    ("working-1.webp",  "working1",  None),
    ("working-2.webp",  "working2",  None),
    ("working-3.webp",  "working3",  None),
    ("working-4.webp",  "working4",  None),
    ("group-1.webp",    "group1",    "left-big"),
    ("group-2.webp",    "group2",    None),
    ("group-3.webp",    "group3",    None),
    ("red-10.webp",     "red10",     None),
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

def build_banner(photo_path: pathlib.Path, scale: int = 1, layout: str | None = None) -> Image.Image:
    """Render one banner at the given scale (1× = 1584×396, 2× = 3168×792).

    layout=None        — default: content on the RIGHT, gradient on the right
    layout="left-big"  — content on the LEFT, bigger logo, gradients on BOTH
                         sides, tagline width matches the slogan width
    """
    w, h = W * scale, H * scale
    base = Image.new("RGB", (w, h), (12, 14, 16))

    # 1. Background photo — cover-crop to banner size
    photo = Image.open(photo_path).convert("RGB")
    photo = cover_crop(photo, w, h)
    base.paste(photo, (0, 0))

    draw = ImageDraw.Draw(base)
    headline_font = ImageFont.truetype(FONT_BOLD, HEADLINE_PT * scale)

    if layout == "left-big":
        # ── Hybrid layout: BIG LOGO on the LEFT, text on the RIGHT.
        # ── Single smooth right-side gradient (same as default banners
        #    but a touch darker for better headline contrast).

        # Smooth dark fade from the right edge inward — no left fade.
        # Slightly extended width + softer easing produces a cleaner
        # transition than the symmetric two-sided gradient we had before.
        grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        gd = ImageDraw.Draw(grad)
        grad_w = int(1050 * scale)
        for i in range(grad_w):
            # Cubic ease-in (^3) → near-transparent for the first 60 % of
            # the gradient, then ramps up sharply toward the right edge.
            t = i / grad_w
            alpha = int(210 * (t ** 2.4))
            x = w - grad_w + i
            gd.line([(x, 0), (x, h)], fill=(0, 0, 0, alpha))
        base.paste(grad, (0, 0), grad)

        # Big MLG logo — LEFT side, top
        big_logo_w = 220                                      # 1× px
        logo = render_svg(LOGO_PATH, big_logo_w * scale)
        lw, lh = logo.size
        margin_l = 70 * scale
        # Vertically centre the logo on the banner height for balance
        logo_y = (h - lh) // 2
        base.paste(logo, (margin_l, logo_y), logo)

        # Headline RIGHT-aligned (same as default layout)
        head_lines = HEADLINE.split("\n")
        head_widths = [draw.textbbox((0, 0), ln, font=headline_font)[2] for ln in head_lines]
        head_block_w = max(head_widths)
        head_x = w - MARGIN_R * scale - head_block_w
        draw.multiline_text(
            (head_x, HEADLINE_Y * scale),
            HEADLINE, font=headline_font, fill=WHITE,
            spacing=int(8 * scale),
        )

        # Tagline — auto-scale font so its rendered width matches the
        # slogan's widest line exactly; right-aligned to the same edge.
        lo, hi = 8, 200
        best_pt = lo
        for _ in range(20):
            mid = (lo + hi) / 2
            f = ImageFont.truetype(FONT_REG, max(1, int(mid * scale)))
            tw = draw.textbbox((0, 0), TAGLINE, font=f)[2]
            if tw < head_block_w:
                best_pt = mid; lo = mid + 0.5
            else:
                hi = mid - 0.5
        tagline_font = ImageFont.truetype(FONT_REG, max(1, int(best_pt * scale)))
        tag_w = draw.textbbox((0, 0), TAGLINE, font=tagline_font)[2]
        draw.text(
            (w - MARGIN_R * scale - tag_w, TAGLINE_Y * scale),
            TAGLINE, font=tagline_font, fill=TAGLINE_FG,
        )
        return base

    # ── Default RIGHT-side layout ────────────────────────────────
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    grad_w = GRADIENT_W * scale
    for i in range(grad_w):
        alpha = int(190 * (i / grad_w) ** 1.2)
        x = w - grad_w + i
        gd.line([(x, 0), (x, h)], fill=(0, 0, 0, alpha))
    base.paste(grad, (0, 0), grad)

    logo = render_svg(LOGO_PATH, LOGO_W * scale)
    lw, lh = logo.size
    logo_x = w - MARGIN_R * scale - lw
    base.paste(logo, (logo_x, MARGIN_T * scale), logo)

    tagline_font = ImageFont.truetype(FONT_REG, TAGLINE_PT * scale)
    head_lines = HEADLINE.split("\n")
    head_widths = [draw.textbbox((0, 0), ln, font=headline_font)[2] for ln in head_lines]
    head_block_w = max(head_widths)
    head_x = w - MARGIN_R * scale - head_block_w
    draw.multiline_text(
        (head_x, HEADLINE_Y * scale),
        HEADLINE, font=headline_font, fill=WHITE,
        spacing=int(8 * scale),
    )
    tag_w = draw.textbbox((0, 0), TAGLINE, font=tagline_font)[2]
    draw.text(
        (w - MARGIN_R * scale - tag_w, TAGLINE_Y * scale),
        TAGLINE, font=tagline_font, fill=TAGLINE_FG,
    )
    return base

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src, slug, layout in VARIATIONS:
        photo = PHOTO_DIR / src
        if not photo.exists():
            print(f"  skip {src} (missing)")
            continue
        # 1×
        b1 = build_banner(photo, scale=1, layout=layout)
        out1 = OUT_DIR / f"mlg-linkedin-{slug}.png"
        b1.save(out1, "PNG", optimize=True)
        # 2×
        b2 = build_banner(photo, scale=SCALE2X, layout=layout)
        out2 = OUT_DIR / f"mlg-linkedin-{slug}@2x.png"
        b2.save(out2, "PNG", optimize=True)
        tag = f" [{layout}]" if layout else ""
        print(f"✓ {slug:10s} ← {src}{tag}")

if __name__ == "__main__":
    main()
