#!/usr/bin/env python3
"""
Build the LinkedIn *company page* banner from the group-1 design.

Differences vs the profile banner (build_linkedin_banners.py):
  • Dimensions: 1128×191 (LinkedIn company page cover) + @2x (2256×382)
  • NO logo — only the headline + tagline over the photo
  • Right-side dark gradient so the text stays legible

Output:
  assets/linkedin/mlg-linkedin-group1-company.png       (1128×191)
  assets/linkedin/mlg-linkedin-group1-company@2x.png    (2256×382)

Run:
  python3 scripts/build_linkedin_company_banner.py
"""
import pathlib, sys
from PIL import Image, ImageDraw, ImageFont

ROOT      = pathlib.Path(__file__).resolve().parent.parent
PHOTO     = ROOT / "assets/photos/group-1.webp"
OUT_DIR   = ROOT / "assets/linkedin"

# LinkedIn company page cover — recommended 1128×191
W, H     = 1128, 191
SCALE2X  = 2

MARGIN_R    = 55      # right padding for text (1× px)
HEADLINE_PT = 34      # "EMPOWERING LEADERSHIP" font size (1× px)

HEADLINE   = "EMPOWERING\nLEADERSHIP"
TAGLINE    = "Developing leaders who shape organizations"
WHITE      = (255, 255, 255, 255)
TAGLINE_FG = (255, 255, 255, 220)

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

def cover_crop(img, tw, th):
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))

def smoothstep(t):
    return t * t * t * (t * (t * 6 - 15) + 10)

def build(scale=1):
    w, h = W * scale, H * scale
    base = Image.new("RGB", (w, h), (12, 14, 16))
    photo = Image.open(PHOTO).convert("RGB")
    base.paste(cover_crop(photo, w, h), (0, 0))

    # Right-side dark gradient (full-width smoothstep from centre → right)
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    peak_alpha = 205
    for x in range(w // 2, w):
        t = (x - w / 2) / (w / 2)
        gd.line([(x, 0), (x, h)], fill=(0, 0, 0, int(peak_alpha * smoothstep(t))))
    base.paste(grad, (0, 0), grad)

    draw = ImageDraw.Draw(base)
    headline_font = load_font(FONT_BOLD_PATH, HEADLINE_PT * scale, FONT_BOLD_INDEX)

    # Render headline lines, crop to true bbox, stretch all to the widest
    # line's width so slogan + tagline form one justified block.
    head_lines = HEADLINE.split("\n")
    asc, dsc = headline_font.getmetrics()
    line_h = asc + dsc
    line_gap = int(6 * scale)
    line_imgs, widths = [], []
    for ln in head_lines:
        tmp = Image.new("RGBA", (line_h * len(ln) + 200, line_h + 4), (0, 0, 0, 0))
        ImageDraw.Draw(tmp).text((0, 0), ln, font=headline_font, fill=WHITE)
        bb = tmp.getbbox()
        if bb:
            tmp = tmp.crop((bb[0], 0, bb[2], line_h + 4))
        widths.append(tmp.width)
        line_imgs.append(tmp)
    block_w = max(widths)
    line_imgs = [li.resize((block_w, li.height), Image.LANCZOS) if li.width != block_w else li
                 for li in line_imgs]

    # Tagline — fit its width to the headline block width
    lo, hi, best_pt, best_err = 6.0, 120.0, 6.0, 1e9
    for _ in range(30):
        mid = (lo + hi) / 2
        f = load_font(FONT_REG_PATH, round(mid * scale), FONT_REG_INDEX)
        tw = draw.textbbox((0, 0), TAGLINE, font=f)[2]
        err = abs(tw - block_w)
        if err < best_err:
            best_err, best_pt = err, mid
        if tw < block_w: lo = mid
        else: hi = mid
    tagline_font = load_font(FONT_REG_PATH, round(best_pt * scale), FONT_REG_INDEX)
    tasc, tdsc = tagline_font.getmetrics()
    tag_h = tasc + tdsc + 4
    tmp = Image.new("RGBA", (block_w + 200, tag_h), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((0, 0), TAGLINE, font=tagline_font, fill=TAGLINE_FG)
    bb = tmp.getbbox()
    if bb:
        tmp = tmp.crop((bb[0], 0, bb[2], tag_h))
    tag_img = tmp.resize((block_w, tag_h), Image.LANCZOS) if tmp.width != block_w else tmp

    # Vertically centre the whole text block
    tag_gap = int(10 * scale)
    block_h = len(line_imgs) * line_h + (len(line_imgs) - 1) * line_gap + tag_gap + tag_img.height
    x = w - MARGIN_R * scale - block_w
    y = (h - block_h) // 2
    for li in line_imgs:
        base.paste(li, (x, y), li)
        y += line_h + line_gap
    y += tag_gap - line_gap
    base.paste(tag_img, (x, y), tag_img)
    return base

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    b2 = build(scale=SCALE2X)
    b2.save(OUT_DIR / "mlg-linkedin-group1-company@2x.png", "PNG", optimize=True)
    b1 = b2.resize((W, H), Image.LANCZOS)
    b1.save(OUT_DIR / "mlg-linkedin-group1-company.png", "PNG", optimize=True)
    print(f"✓ company banner  {W}×{H}  (+@2x {W*SCALE2X}×{H*SCALE2X})  ← group-1.webp, no logo")

if __name__ == "__main__":
    main()
