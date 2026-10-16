#!/usr/bin/env python3
"""Rebuild the post lists and the RSS feed from the posts themselves.

Every posts/*.html file (except posts/index.html) is a post. From each one this reads:
  - the title:       <title>...</title>
  - the date:        the first <p><i>YYYY-MM-DD</i></p>
  - the description: <meta name="description" content="...">

It then rewrites, newest first:
  - every block between <!-- posts --> and <!-- /posts --> in index.html and posts/index.html
    (add limit=N to the opening marker to show only the N newest, e.g. <!-- posts limit=3 -->)
  - the <item> list in feed.xml

The deploy workflow runs it before publishing; you can also run it locally:
  python3 .github/build_posts.py
"""
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://chalmovsky.com"
PAGES = [ROOT / "index.html", ROOT / "posts" / "index.html"]
FEED = ROOT / "feed.xml"
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
DAYS = "Mon Tue Wed Thu Fri Sat Sun".split()


def read_post(path):
    text = path.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", text, re.S)
    date = re.search(r"<p><i>(\d{4})-(\d{2})-(\d{2})</i></p>", text)
    desc = re.search(r'<meta name="description" content="(.*?)">', text, re.S)
    missing = [name for name, m in (("<title>", title), ("<p><i>YYYY-MM-DD</i></p> date", date)) if not m]
    if missing:
        sys.exit(f"{path.relative_to(ROOT)}: missing {', '.join(missing)}")
    y, m, d = (int(x) for x in date.groups())
    return {
        "file": path.name,
        "title": html.unescape(title.group(1).strip()),
        "date": f"{y:04d}-{m:02d}-{d:02d}",
        "ymd": (y, m, d),
        "desc": html.unescape(desc.group(1).strip()) if desc else "",
    }


def weekday(y, m, d):
    # Sakamoto's method, shifted so 0 = Monday
    t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
    yy = y - (m < 3)
    return (yy + yy // 4 - yy // 100 + yy // 400 + t[m - 1] + d + 6) % 7


def list_items(posts, indent):
    return "".join(
        f'{indent}<li>{p["date"]} <a href="/posts/{p["file"]}">{html.escape(p["title"], quote=False)}</a></li>\n'
        for p in posts
    )


def rewrite_lists(path, posts):
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r"(?P<open>([ \t]*)<!-- posts(?: limit=(?P<limit>\d+))? -->\n)(?P<body>.*?)(?P<close>[ \t]*<!-- /posts -->)", re.S)

    def fill(m):
        limit = int(m.group("limit")) if m.group("limit") else None
        return m.group("open") + list_items(posts[:limit], m.group(2)) + m.group("close")

    new, count = pattern.subn(fill, text)
    if not count:
        sys.exit(f"{path.relative_to(ROOT)}: no <!-- posts --> ... <!-- /posts --> block found")
    return new


def rewrite_feed(posts):
    text = FEED.read_text(encoding="utf-8")
    items = ""
    for p in posts:
        y, m, d = p["ymd"]
        url = f"{SITE}/posts/{p['file']}"
        items += (
            "    <item>\n"
            f"      <title>{html.escape(p['title'], quote=False)}</title>\n"
            f"      <link>{url}</link>\n"
            f"      <guid>{url}</guid>\n"
            f"      <pubDate>{DAYS[weekday(y, m, d)]}, {d:02d} {MONTHS[m - 1]} {y} 12:00:00 GMT</pubDate>\n"
            f"      <description>{html.escape(p['desc'], quote=False)}</description>\n"
            "    </item>\n\n"
        )
    new, count = re.subn(r"(    <!-- items -->\n).*?(  </channel>)", lambda m: m.group(1) + items.rstrip("\n") + "\n" + m.group(2), text, flags=re.S)
    if not count:
        sys.exit("feed.xml: no <!-- items --> marker before </channel>")
    return new


def main():
    posts = [read_post(p) for p in sorted((ROOT / "posts").glob("*.html")) if p.name != "index.html"]
    posts.sort(key=lambda p: (p["ymd"], p["file"]), reverse=True)
    changed = []
    for path, text in [(p, rewrite_lists(p, posts)) for p in PAGES] + [(FEED, rewrite_feed(posts))]:
        if path.read_text(encoding="utf-8") != text:
            path.write_text(text, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))
    print(f"{len(posts)} posts; updated: {', '.join(changed) or 'nothing'}")


if __name__ == "__main__":
    main()
