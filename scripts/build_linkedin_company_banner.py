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
LOGO    = ROOT / "assets/logo-white-bold.svg"
OUT_DIR = ROOT / "assets/linkedin"

# LinkedIn company page cover — recommended 1128×191
W, H     = 1128, 191
SCALE2X  = 2

MARGIN_L    = 55      # left padding for logo (1× px)
MARGIN_R    = 55      # right padding for text (1× px)
MARGIN_T    = 26      # top padding for logo (1× px)
LOGO_W      = 150     # logo width (1× px)
HEADLINE_PT = 37      # "EMPOWERING LEADERSHIP" font size (1× px)
SUBHEAD_PT  = 14      # subheader font size (1× px)

HEADLINE   = "EMPOWERING\nLEADERSHIP"
SUBHEAD    = "Developing leaders who shape organizations"
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

    # Right-side dark gradient (full-width smoothstep from centre → right)
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    peak = 200
    for x in range(w // 2, w):
        t = (x - w / 2) / (w / 2)
        gd.line([(x, 0), (x, h)], fill=(0, 0, 0, int(peak * smoothstep(t))))
    base.paste(grad, (0, 0), grad)

    # Headline — 2 lines stretched to equal width (justified block)
    hf = load_font(FONT_BOLD_PATH, HEADLINE_PT * scale, FONT_BOLD_INDEX)
    hlines = [render_line(ln, hf, WHITE) for ln in HEADLINE.split("\n")]
    hlines = [li.crop(li.getbbox()) for li in hlines]   # tight vertical crop (glyph height only)
    block_w = max(li.width for li in hlines)
    hlines = [li.resize((block_w, li.height), Image.LANCZOS) if li.width != block_w else li for li in hlines]
    head_line_gap = int(8 * scale)
    head_h = sum(li.height for li in hlines) + head_line_gap * (len(hlines) - 1)

    # Subheader — single line, bold, stretched to EXACTLY the headline
    # block width so slogan + tagline share both edges (justified block).
    draw = ImageDraw.Draw(base)
    lo, hi, best_pt, best_err = 6.0, 120.0, 6.0, 1e9
    for _ in range(30):
        mid = (lo + hi) / 2
        f = load_font(FONT_BOLD_PATH, round(mid * scale), FONT_BOLD_INDEX)
        tw = draw.textbbox((0, 0), SUBHEAD, font=f)[2]
        err = abs(tw - block_w)
        if err < best_err:
            best_err, best_pt = err, mid
        if tw < block_w: lo = mid
        else: hi = mid
    sf = load_font(FONT_BOLD_PATH, round(best_pt * scale), FONT_BOLD_INDEX)
    sub_img = render_line(SUBHEAD, sf, SUBHEAD_FG)
    if sub_img.width != block_w:
        sub_img = sub_img.resize((block_w, sub_img.height), Image.LANCZOS)
    sub_h = sub_img.height

    gap_head_sub = int(16 * scale)
    total_h = head_h + gap_head_sub + sub_h
    right = w - MARGIN_R * scale
    y = (h - total_h) // 2

    for li in hlines:                       # headline right-aligned (block)
        base.paste(li, (right - li.width, y), li)
        y += li.height + head_line_gap
    y = y - head_line_gap + gap_head_sub
    base.paste(sub_img, (right - sub_img.width, y), sub_img)
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
