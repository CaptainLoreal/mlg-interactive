#!/usr/bin/env python3
"""
Build the LinkedIn *company page* banner from the group-1 design.

  • Dimensions: 1128×191 (LinkedIn company page cover) + @2x (2256×382)
  • MLG logo (white/red) — left, vertically centred
  • "EMPOWERING LEADERSHIP" headline — right, justified block
  • Subheader "We build the cognitive and emotional operating system
    of leadership" — right, under the headline
  • Mirrored dark gradient so logo + text stay legible

Output:
  assets/linkedin/mlg-linkedin-group1-company.png       (1128×191)
  assets/linkedin/mlg-linkedin-group1-company@2x.png    (2256×382)

Run:
  DYLD_LIBRARY_PATH=/opt/homebrew/lib python3 scripts/build_linkedin_company_banner.py
"""
import io, pathlib, sys
from PIL import Image, ImageDraw, ImageFont
import cairosvg

ROOT    = pathlib.Path(__file__).resolve().parent.parent
PHOTO   = ROOT / "assets/photos/group-1.webp"
LOGO    = ROOT / "assets/logo-white.svg"
OUT_DIR = ROOT / "assets/linkedin"

# LinkedIn company page cover — recommended 1128×191
W, H     = 1128, 191
SCALE2X  = 2

MARGIN_L    = 55      # left padding for logo (1× px)
MARGIN_R    = 55      # right padding for text (1× px)
MARGIN_T    = 26      # top padding for logo (1× px)
LOGO_W      = 150     # logo width (1× px)
HEADLINE_PT = 30      # "EMPOWERING LEADERSHIP" font size (1× px)
SUBHEAD_PT  = 14      # subheader font size (1× px)

HEADLINE   = "EMPOWERING\nLEADERSHIP"
SUBHEAD    = "We build the cognitive and emotional\noperating system of leadership"
WHITE      = (255, 255, 255, 255)
SUBHEAD_FG = (255, 255, 255, 224)

HELVETICA_TTC = "/System/Library/Fonts/Helvetica.ttc"
FONT_BOLD_PATH, FONT_BOLD_INDEX = HELVETICA_TTC, 1
FONT_REG_PATH,  FONT_REG_INDEX  = HELVETICA_TTC, 0
if not pathlib.Path(HELVETICA_TTC).exists():
    FONT_BOLD_PATH, FONT_BOLD_INDEX = "/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0
    FONT_REG_PATH,  FONT_REG_INDEX  = "/System/Library/Fonts/Supplemental/Arial.ttf", 0
if not pathlib.Path(FONT_BOLD_PATH).exists():
    sys.exit("Need Helvetica or Arial Bold.")

def load_font(path, size, index=0):
    return ImageFont.truetype(path, max(1, int(size)), index=index)

def render_svg(svg_path, width_px):
    png = cairosvg.svg2png(url=str(svg_path), output_width=int(width_px))
    return Image.open(io.BytesIO(png)).convert("RGBA")

def cover_crop(img, tw, th):
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))

def smoothstep(t):
    return t * t * t * (t * (t * 6 - 15) + 10)

def render_line(text, font, fill):
    """Render a single text line, cropped horizontally to its glyph bbox
    but keeping the full ascent+descent line height for stable baselines."""
    asc, dsc = font.getmetrics()
    line_h = asc + dsc + 4
    tmp = Image.new("RGBA", (line_h * len(text) + 400, line_h), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((0, 0), text, font=font, fill=fill)
    bb = tmp.getbbox()
    if bb:
        tmp = tmp.crop((bb[0], 0, bb[2], line_h))
    return tmp

def build(scale=1):
    w, h = W * scale, H * scale
    base = Image.new("RGB", (w, h), (12, 14, 16))
    photo = Image.open(PHOTO).convert("RGB")
    base.paste(cover_crop(photo, w, h), (0, 0))

    # Mirrored dark gradient (full-width smoothstep, both edges dark)
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    peak = 195
    for x in range(w // 2, w):
        t = (x - w / 2) / (w / 2)
        gd.line([(x, 0), (x, h)], fill=(0, 0, 0, int(peak * smoothstep(t))))
    for x in range(0, w // 2):
        t = 1 - x / (w / 2)
        gd.line([(x, 0), (x, h)], fill=(0, 0, 0, int(peak * smoothstep(t))))
    base.paste(grad, (0, 0), grad)

    # Logo — top-left
    logo = render_svg(LOGO, LOGO_W * scale)
    lw, lh = logo.size
    base.paste(logo, (MARGIN_L * scale, MARGIN_T * scale), logo)

    # Headline — 2 lines stretched to equal width (justified block)
    hf = load_font(FONT_BOLD_PATH, HEADLINE_PT * scale, FONT_BOLD_INDEX)
    hlines = [render_line(ln, hf, WHITE) for ln in HEADLINE.split("\n")]
    block_w = max(li.width for li in hlines)
    hlines = [li.resize((block_w, li.height), Image.LANCZOS) if li.width != block_w else li for li in hlines]
    head_line_gap = int(5 * scale)
    head_h = sum(li.height for li in hlines) + head_line_gap * (len(hlines) - 1)

    # Subheader — 2 lines, right-aligned (natural widths)
    sf = load_font(FONT_REG_PATH, SUBHEAD_PT * scale, FONT_REG_INDEX)
    slines = [render_line(ln, sf, SUBHEAD_FG) for ln in SUBHEAD.split("\n")]
    sub_line_gap = int(3 * scale)
    sub_h = sum(li.height for li in slines) + sub_line_gap * (len(slines) - 1)

    gap_head_sub = int(12 * scale)
    total_h = head_h + gap_head_sub + sub_h
    right = w - MARGIN_R * scale
    y = (h - total_h) // 2

    for li in hlines:                       # headline right-aligned (block)
        base.paste(li, (right - li.width, y), li)
        y += li.height + head_line_gap
    y = y - head_line_gap + gap_head_sub
    for li in slines:                       # subheader right-aligned
        base.paste(li, (right - li.width, y), li)
        y += li.height + sub_line_gap
    return base

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    b2 = build(scale=SCALE2X)
    b2.save(OUT_DIR / "mlg-linkedin-group1-company@2x.png", "PNG", optimize=True)
    b1 = b2.resize((W, H), Image.LANCZOS)
    b1.save(OUT_DIR / "mlg-linkedin-group1-company.png", "PNG", optimize=True)
    print(f"✓ company banner  {W}×{H}  (+@2x {W*SCALE2X}×{H*SCALE2X})  ← group-1.webp, logo + new subheader")

if __name__ == "__main__":
    main()
