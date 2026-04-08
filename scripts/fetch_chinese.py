#!/usr/bin/env python3
"""
Fetch Chinese translation of Dante's Divine Comedy from zh.wikisource.org
Translation: 王维克 (Wang Weike), 1939 - Public Domain

Run this script to download and parse the Chinese text:
  python3 scripts/fetch_chinese.py
"""

import json
import os
import re
import time
import urllib.request
import urllib.parse
import urllib.error

WIKISOURCE_API = 'https://zh.wikisource.org/w/api.php'
MOBILE_BASE = 'https://zh.m.wikisource.org'

# zh.wikisource.org page titles for each canto
# 神曲/地獄篇/第X章  (Traditional Chinese on Wikisource)
PAGE_TEMPLATES = {
    'inferno': '神曲/地獄篇/第{}章',
    'purgatorio': '神曲/煉獄篇/第{}章',
    'paradiso': '神曲/天堂篇/第{}章',
}

CANTO_COUNTS = {
    'inferno': 34,
    'purgatorio': 33,
    'paradiso': 33,
}

CHINESE_NUMBERS = [
    '一','二','三','四','五','六','七','八','九','十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '二十一','二十二','二十三','二十四','二十五','二十六','二十七','二十八','二十九','三十',
    '三十一','三十二','三十三','三十四',
]


def fetch_page_wikitext(title):
    """Fetch wikitext for a Wikisource page."""
    params = urllib.parse.urlencode({
        'action': 'parse',
        'page': title,
        'prop': 'wikitext',
        'format': 'json',
        'utf8': '1',
    })
    url = f'{WIKISOURCE_API}?{params}'
    req = urllib.request.Request(url, headers={'User-Agent': 'DanteDivineComedyReader/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data.get('parse', {}).get('wikitext', {}).get('*', '')
    except Exception as e:
        return None


def fetch_page_html(title):
    """Fetch HTML for a Wikisource page and extract text."""
    params = urllib.parse.urlencode({
        'action': 'parse',
        'page': title,
        'prop': 'text',
        'format': 'json',
        'utf8': '1',
    })
    url = f'{WIKISOURCE_API}?{params}'
    req = urllib.request.Request(url, headers={'User-Agent': 'DanteDivineComedyReader/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            html = data.get('parse', {}).get('text', {}).get('*', '')
            return html
    except Exception as e:
        return None


def extract_lines_from_wikitext(wikitext):
    """Extract verse lines from wiki markup."""
    if not wikitext:
        return []

    lines = []
    # Remove wiki templates and markup, keep text lines
    # Remove templates like {{wikisource header ...}}
    text = re.sub(r'\{\{[^}]*\}\}', '', wikitext)
    # Remove wiki links [[text]] -> text
    text = re.sub(r'\[\[([^|\]]+\|)?([^\]]+)\]\]', r'\2', text)
    # Remove bold/italic markup
    text = re.sub(r"'{2,3}", '', text)
    # Remove comments
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    # Remove categories
    text = re.sub(r'\[\[Category:[^\]]*\]\]', '', text)

    for line in text.split('\n'):
        line = line.strip()
        if line and not line.startswith('=') and not line.startswith('|') and not line.startswith('!'):
            # Skip lines that look like template/table markup
            if not line.startswith('{') and not line.startswith('}'):
                lines.append(line)

    return [l for l in lines if l]


def parse_html_content(html):
    """Simple HTML text extractor."""
    if not html:
        return []

    # Remove script/style tags and their content
    html = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html, flags=re.DOTALL|re.IGNORECASE)
    # Remove HTML tags
    html = re.sub(r'<br\s*/?>', '\n', html, flags=re.IGNORECASE)
    html = re.sub(r'<p[^>]*>', '\n', html, flags=re.IGNORECASE)
    html = re.sub(r'<[^>]+>', '', html)
    # Decode HTML entities
    html = html.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&nbsp;', ' ')

    lines = []
    for line in html.split('\n'):
        line = line.strip()
        if line and len(line) > 2:
            lines.append(line)
    return lines


def fetch_canto(book, number):
    """Fetch a single canto text."""
    cn = CHINESE_NUMBERS[number - 1]
    title = PAGE_TEMPLATES[book].format(cn)
    print(f"  Fetching {title}...", end=' ', flush=True)

    # Try wikitext first
    wikitext = fetch_page_wikitext(title)
    if wikitext and len(wikitext) > 100:
        lines = extract_lines_from_wikitext(wikitext)
        if len(lines) > 5:
            print(f"OK ({len(lines)} lines)")
            return lines

    # Try HTML
    html = fetch_page_html(title)
    if html:
        lines = parse_html_content(html)
        if len(lines) > 5:
            print(f"OK via HTML ({len(lines)} lines)")
            return lines

    print("FAILED")
    return None


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    out_dir = os.path.join(project_dir, 'data', 'parsed')
    os.makedirs(out_dir, exist_ok=True)

    book_info = {
        'inferno': {'title': 'Inferno', 'title_zh': '地狱篇'},
        'purgatorio': {'title': 'Purgatorio', 'title_zh': '炼狱篇'},
        'paradiso': {'title': 'Paradiso', 'title_zh': '天堂篇'},
    }

    ROMAN = {
        1:'I', 2:'II', 3:'III', 4:'IV', 5:'V',
        6:'VI', 7:'VII', 8:'VIII', 9:'IX', 10:'X',
        11:'XI', 12:'XII', 13:'XIII', 14:'XIV', 15:'XV',
        16:'XVI', 17:'XVII', 18:'XVIII', 19:'XIX', 20:'XX',
        21:'XXI', 22:'XXII', 23:'XXIII', 24:'XXIV', 25:'XXV',
        26:'XXVI', 27:'XXVII', 28:'XXVIII', 29:'XXIX', 30:'XXX',
        31:'XXXI', 32:'XXXII', 33:'XXXIII', 34:'XXXIV',
    }

    for book_key in ['inferno', 'purgatorio', 'paradiso']:
        print(f"\nFetching {book_key} (Chinese)...")
        count = CANTO_COUNTS[book_key]
        cantos = []
        failed = []

        for n in range(1, count + 1):
            lines = fetch_canto(book_key, n)
            if lines:
                cantos.append({
                    'number': n,
                    'roman': ROMAN[n],
                    'title': f'第{CHINESE_NUMBERS[n-1]}章',
                    'lines': lines,
                })
            else:
                failed.append(n)
                cantos.append({
                    'number': n,
                    'roman': ROMAN[n],
                    'title': f'第{CHINESE_NUMBERS[n-1]}章',
                    'lines': ['（此章节文本暂未加载，请运行 fetch_chinese.py 脚本获取中文版本）'],
                })
            time.sleep(0.5)  # Be polite to the server

        result = {
            'id': book_key,
            'title': book_info[book_key]['title'],
            'title_zh': book_info[book_key]['title_zh'],
            'translator': '王维克（1939）',
            'source': 'https://zh.wikisource.org/wiki/神曲',
            'license': '公有领域',
            'cantos': cantos,
        }

        out_path = os.path.join(out_dir, f'{book_key}_zh.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        ok = count - len(failed)
        print(f"  {ok}/{count} cantos fetched. Saved to {out_path}")
        if failed:
            print(f"  Failed cantos: {failed}")


if __name__ == '__main__':
    main()
