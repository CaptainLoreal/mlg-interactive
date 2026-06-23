#!/usr/bin/env python3
"""
Deep mobile-perf pass — generates minified siblings of styles.css /
app.js / subnav.js, recompresses every WebP photo at a slightly
lower quality (visually identical, ~30 % smaller), and adds explicit
width / height attributes to <img> tags that are missing them so the
browser can reserve layout space ahead of decode (no CLS, faster
first paint).

After running this script the HTML still references the same
URLs — the *.min.css / *.min.js files are produced as siblings and
the cache-bust query string is bumped by a separate Edit step.

Run:
  python3 scripts/optimize.py
"""
import io, os, re, pathlib
from PIL import Image
import csscompressor                 # robust CSS minifier (preserves @media nesting)
import rjsmin                         # robust JS minifier (string + regex literal aware)

ROOT = pathlib.Path(__file__).resolve().parent.parent

def minify_css(s: str) -> str:
    """Minify CSS with csscompressor — known to correctly preserve
    @media / @keyframes / @page nesting, which the previous hand-rolled
    regex minifier silently broke (introduced a global .website-cta
    {display:none} rule by misreading the @media print scope)."""
    out = csscompressor.compress(s)
    # csscompressor over-optimises lengths to unitless 0, INCLUDING the
    # fallback inside env() — e.g. env(safe-area-inset-bottom, 0px) →
    # env(safe-area-inset-bottom,0). That breaks calc/max math
    # (`0 + 22px` mixes number+length and invalidates the whole
    # declaration), which knocked the "Straight to website" button off
    # the bottom. Restore a length unit on env() fallbacks.
    out = re.sub(r'(env\([^,()]+,\s*)0\)', r'\g<1>0px)', out)
    return out

def minify_js(s: str) -> str:
    """Minify JS with rjsmin — string / template / regex-literal aware,
    well-tested. Replaces the previous hand-rolled state machine."""
    return rjsmin.jsmin(s)

# ── CSS + JS ───────────────────────────────────────────────────────
def write_min(src: pathlib.Path, fn):
    txt = src.read_text(encoding='utf-8')
    out = src.with_suffix('.min' + src.suffix)
    out.write_text(fn(txt), encoding='utf-8')
    print(f'  {src.name:18s} {len(txt):>7d}B → {out.name:22s} {out.stat().st_size:>7d}B  ({100*(1-out.stat().st_size/len(txt)):.0f}% smaller)')

print('=== CSS / JS minify ===')
write_min(ROOT/'styles.css', minify_css)
write_min(ROOT/'app.js',     minify_js)
write_min(ROOT/'subnav.js',  minify_js)

# ── WebP recompress ────────────────────────────────────────────────
# DISABLED by default. This step used to re-encode every WebP at
# quality 72 IN PLACE on every build. Because it re-read the already-
# compressed files and re-saved them lossily, each run added generation
# loss — over many builds the photos visibly degraded (originals ~148K
# dropped to ~93K, some far worse). Photos are now kept at full quality.
#
# Set MLG_RECOMPRESS=1 to opt in for a deliberate one-off pass. Even
# then, only run it on PRISTINE sources — never repeatedly in place.
if os.environ.get('MLG_RECOMPRESS') == '1':
    print('\n=== WebP photo recompress (quality 82, method 6) — OPT-IN ===')
    photos = sorted((ROOT/'assets/photos').glob('*.webp'))
    total_before = total_after = 0
    for p in photos:
        before = p.stat().st_size
        total_before += before
        im = Image.open(p).convert('RGB')
        buf = io.BytesIO()
        im.save(buf, 'WEBP', quality=82, method=6)
        new_bytes = buf.getvalue()
        # only overwrite if actually smaller (small files can grow with method 6 sometimes)
        if len(new_bytes) < before:
            p.write_bytes(new_bytes)
            total_after += len(new_bytes)
            flag = '✓'
        else:
            total_after += before
            flag = '·'
        print(f'  {flag} {p.name:24s} {before/1024:>6.1f}K → {len(new_bytes)/1024:>6.1f}K')
    print(f'\n  total: {total_before/1024:.0f}K → {total_after/1024:.0f}K  ({100*(1-total_after/total_before):.0f}% smaller)')
else:
    print('\n=== WebP photo recompress: SKIPPED (photos kept at full quality) ===')
