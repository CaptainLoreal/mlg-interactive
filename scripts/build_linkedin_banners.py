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

# Helvetica.ttc is a font collection (TTC) on macOS: index 0 = Regular,
# index 1 = Bold, index 2 = Oblique, index 3 = Bold Oblique. PIL can
# load a specific face by passing `index=` to ImageFont.truetype.
HELVETICA_TTC = "/System/Library/Fonts/Helvetica.ttc"
FONT_BOLD_PATH = HELVETICA_TTC
FONT_BOLD_INDEX = 1
FONT_REG_PATH  = HELVETICA_TTC
FONT_REG_INDEX = 0
if not pathlib.Path(HELVETICA_TTC).exists():
    # fallback to Arial Bold + Regular
    FONT_BOLD_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    FONT_BOLD_INDEX = 0
    FONT_REG_PATH  = "/System/Library/Fonts/Supplemental/Arial.ttf"
    FONT_REG_INDEX = 0
if not pathlib.Path(FONT_BOLD_PATH).exists():
    sys.exit("Need Helvetica or Arial Bold.")

def load_font(path, size, index=0):
    return ImageFont.truetype(path, size, index=index)

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
    headline_font = load_font(FONT_BOLD_PATH, HEADLINE_PT * scale, FONT_BOLD_INDEX)

    if layout == "left-big":
        # ── Hybrid layout: BIG LOGO top-left corner, text right.
        # ── SMOOTH mirrored gradient — uses a sigmoid-like smoothstep
        #    (t³(6t² - 15t + 10)) so the start AND end of the fade are
        #    both gentle, no visible "seam" where the gradient meets
        #    the transparent middle. Each side now spans the FULL width
        #    instead of a fixed grad_w, eliminating the hard inner edge.
        def smoothstep(t):
            # Quintic Hermite (Perlin's smootherstep) — no derivative
            # discontinuity at t=0 or t=1 → invisible gradient endpoints.
            return t * t * t * (t * (t * 6 - 15) + 10)

        grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        gd = ImageDraw.Draw(grad)
        peak_alpha = 195

        # Right side gradient: spans the full width of the banner so
        # it has nowhere to terminate visibly. From the centre (alpha 0)
        # to the right edge (alpha peak), smoothstep eased.
        for x in range(w // 2, w):
            t = (x - w / 2) / (w / 2)
            alpha = int(peak_alpha * smoothstep(t))
            gd.line([(x, 0), (x, h)], fill=(0, 0, 0, alpha))
        # Left side gradient: mirror — full half-width.
        for x in range(0, w // 2):
            t = 1 - x / (w / 2)
            alpha = int(peak_alpha * smoothstep(t))
            gd.line([(x, 0), (x, h)], fill=(0, 0, 0, alpha))
        base.paste(grad, (0, 0), grad)

        # Big MLG logo — UPPER-LEFT corner (top margin, not centred)
        big_logo_w = 220                                      # 1× px
        logo = render_svg(LOGO_PATH, big_logo_w * scale)
        lw, lh = logo.size
        margin_l = 70 * scale
        base.paste(logo, (margin_l, MARGIN_T * scale), logo)

        # Headline RIGHT-aligned, and each line stretched horizontally
        # to the SAME width as the widest line (LEADERSHIP). This makes
        # the slogan + tagline form a single visually justified block:
        # every line shares BOTH the same left x and the same right x.
        head_lines = HEADLINE.split("\n")
        head_ascent, head_descent = headline_font.getmetrics()
        line_h = head_ascent + head_descent
        line_gap = int(8 * scale)
        # Render each line, find true bbox, then stretch to head_block_w.
        line_imgs = []
        line_natural_widths = []
        for ln in head_lines:
            tmp = Image.new("RGBA", (line_h * len(ln) + 200, line_h + 4), (0, 0, 0, 0))
            ImageDraw.Draw(tmp).text((0, 0), ln, font=headline_font, fill=WHITE)
            bb = tmp.getbbox()
            if bb:
                tmp = tmp.crop((bb[0], 0, bb[2], line_h + 4))
            line_natural_widths.append(tmp.width)
            line_imgs.append(tmp)
        head_block_w = max(line_natural_widths)
        # Now horizontally stretch any narrower line up to head_block_w
        line_imgs = [
            li.resize((head_block_w, li.height), Image.LANCZOS) if li.width != head_block_w else li
            for li in line_imgs
        ]
        head_x = w - MARGIN_R * scale - head_block_w
        cur_y = HEADLINE_Y * scale
        for li in line_imgs:
            base.paste(li, (head_x, cur_y), li)
            cur_y += line_h + line_gap
        # Track the bottom of the headline block for the tagline placement
        head_block_bottom = cur_y - line_gap

        # Tagline — pick the font size whose rendered width is CLOSEST
        # to the slogan's widest line (may slightly under- or over-shoot
        # by up to ~1 px, then we letter-stretch to land it exactly).
        # Previous version only allowed under-shoot, which left a 4-8 px
        # gap on the right.
        lo, hi = 8.0, 200.0
        best_pt, best_err = lo, 1e9
        for _ in range(30):
            mid = (lo + hi) / 2
            f = load_font(FONT_REG_PATH, max(1, int(round(mid * scale))), FONT_REG_INDEX)
            tw = draw.textbbox((0, 0), TAGLINE, font=f)[2]
            err = abs(tw - head_block_w)
            if err < best_err:
                best_err, best_pt = err, mid
            if tw < head_block_w:
                lo = mid
            else:
                hi = mid
        tagline_font = load_font(FONT_REG_PATH, max(1, int(round(best_pt * scale))), FONT_REG_INDEX)

        # Render the tagline to its own RGBA buffer at the natural size,
        # then horizontally stretch it to EXACTLY head_block_w. This
        # guarantees pixel-perfect right-edge alignment with the slogan.
        # Render into a buffer the EXACT width of the text (no padding),
        # then crop to the true bounding box before stretching — any
        # leading/trailing transparent pixels would scale-stretch and
        # leave the visible text slightly narrower than the buffer.
        asc, dsc = tagline_font.getmetrics()
        tag_h = asc + dsc + 4
        # Render onto a generous buffer first…
        tmp = Image.new("RGBA", (head_block_w + 200, tag_h), (0, 0, 0, 0))
        ImageDraw.Draw(tmp).text((0, 0), TAGLINE, font=tagline_font, fill=TAGLINE_FG)
        # …then crop to the actual non-transparent bbox so resize maps
        # the TEXT (not the buffer) to exactly head_block_w.
        bbox = tmp.getbbox()
        if bbox:
            tmp = tmp.crop((bbox[0], 0, bbox[2], tag_h))
        if tmp.width != head_block_w:
            tag_img = tmp.resize((head_block_w, tag_h), Image.LANCZOS)
        else:
            tag_img = tmp

        # Tagline sits 8 px under the actual bottom of the rendered
        # headline block (uses head_block_bottom computed above —
        # accurate regardless of font ascent/descent details).
        tag_y = head_block_bottom + int(8 * scale)
        tag_x = w - MARGIN_R * scale - head_block_w
        base.paste(tag_img, (tag_x, tag_y), tag_img)
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

    tagline_font = load_font(FONT_REG_PATH, TAGLINE_PT * scale, FONT_REG_INDEX)
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
        # Render ONCE at 2× — font hinting makes textbbox non-linear
        # across sizes, so a fresh 1× render would have subtly different
        # proportions (e.g. "EMPOWERING" stretching by a different ratio
        # than at 2×). Downsampling the 2× output with LANCZOS gives a
        # pixel-perfect, proportionally identical 1× version.
        b2 = build_banner(photo, scale=SCALE2X, layout=layout)
        out2 = OUT_DIR / f"mlg-linkedin-{slug}@2x.png"
        b2.save(out2, "PNG", optimize=True)
        b1 = b2.resize((W, H), Image.LANCZOS)
        out1 = OUT_DIR / f"mlg-linkedin-{slug}.png"
        b1.save(out1, "PNG", optimize=True)
        tag = f" [{layout}]" if layout else ""
        print(f"✓ {slug:10s} ← {src}{tag}")

if __name__ == "__main__":
    main()
