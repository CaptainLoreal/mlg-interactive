#!/usr/bin/env python3
"""Refresh <lastmod> in sitemap.xml so Google's recrawl hints stay accurate.

Each <url>'s lastmod is set per-page from git:
  • a file with uncommitted/staged changes → today (it's about to ship)
  • otherwise → the date of the last commit that touched it
  • fallback → the file's mtime

Everything else in the sitemap (loc, hreflang alternates, priority, ordering)
is preserved byte-for-byte — only the <lastmod> values change.

Run before committing HTML changes (the pre-commit hook in .githooks does this
automatically). Safe to run any time; it's idempotent for unchanged files.

    python3 scripts/build_sitemap.py [--quiet]
"""
import re, os, sys, subprocess, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent   # the site/ dir (git root)
SITEMAP = ROOT / 'sitemap.xml'
BASE = 'https://www.munichleadership.com/'
TODAY = datetime.date.today().isoformat()
QUIET = '--quiet' in sys.argv

def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True).stdout

def loc_to_file(loc):
    """Map a sitemap <loc> URL to its repo-relative file path."""
    path = loc[len(BASE):] if loc.startswith(BASE) else loc.lstrip('/')
    if path in ('', '/'):      return 'index.html'
    if path in ('de/', 'de'):  return 'de/index.html'
    return path

# Files that differ from HEAD (staged, unstaged, or untracked) → ship today.
changed = set(filter(None, (
    git('diff', 'HEAD', '--name-only') +
    git('diff', '--cached', '--name-only') +
    git('ls-files', '--others', '--exclude-standard')
).splitlines()))

_date_cache = {}
def lastmod_for(f):
    if f in changed:
        return TODAY
    if f in _date_cache:
        return _date_cache[f]
    d = git('log', '-1', '--format=%cd', '--date=short', '--', f).strip()
    if not d:
        p = ROOT / f
        d = (datetime.date.fromtimestamp(p.stat().st_mtime).isoformat()
             if p.exists() else TODAY)
    _date_cache[f] = d
    return d

missing = []
def refresh(block):
    m = re.search(r'<loc>([^<]+)</loc>', block)
    f = loc_to_file(m.group(1))
    if not (ROOT / f).exists():
        missing.append(f)
    lm = lastmod_for(f)
    return re.sub(r'<lastmod>[^<]*</lastmod>', f'<lastmod>{lm}</lastmod>', block)

src = SITEMAP.read_text('utf-8')
out = re.sub(r'<url>.*?</url>', lambda m: refresh(m.group(0)), src, flags=re.S)
SITEMAP.write_text(out, 'utf-8')

if not QUIET:
    dates = re.findall(r'<lastmod>([^<]+)</lastmod>', out)
    from collections import Counter
    print(f'sitemap.xml refreshed — {len(dates)} URLs')
    for d, n in sorted(Counter(dates).items(), reverse=True):
        print(f'  {d}: {n}')
    if missing:
        print(f'  WARNING: {len(missing)} loc(s) have no matching file, e.g. {missing[:3]}')
