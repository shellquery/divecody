#!/usr/bin/env python3
"""
Merge partial Chinese translation files into final zh JSON files.
Run after agent translation tasks complete.
"""
import json, os, sys

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
PARTS_DIR = os.path.join(DATA_DIR, 'zh_parts')
OUT_DIR = os.path.join(DATA_DIR, 'parsed')

ROMAN = {
    1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',
    11:'XI',12:'XII',13:'XIII',14:'XIV',15:'XV',16:'XVI',17:'XVII',18:'XVIII',
    19:'XIX',20:'XX',21:'XXI',22:'XXII',23:'XXIII',24:'XXIV',25:'XXV',
    26:'XXVI',27:'XXVII',28:'XXVIII',29:'XXIX',30:'XXX',31:'XXXI',32:'XXXII',
    33:'XXXIII',34:'XXXIV',
}

BOOKS = {
    'inferno':   {'title':'Inferno',   'title_zh':'地狱篇',  'parts':['inferno_1_17.json','inferno_18_34.json'], 'count':34},
    'purgatorio':{'title':'Purgatorio','title_zh':'炼狱篇', 'parts':['purgatorio_all.json'], 'count':33},
    'paradiso':  {'title':'Paradiso',  'title_zh':'天堂篇', 'parts':['paradiso_all.json'], 'count':33},
}

def merge_book(book_key):
    info = BOOKS[book_key]
    all_cantos = []

    for part_file in info['parts']:
        path = os.path.join(PARTS_DIR, part_file)
        if not os.path.exists(path):
            print(f"  WARNING: {part_file} not found, skipping")
            continue
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            all_cantos.extend(data)
        elif isinstance(data, dict) and 'cantos' in data:
            all_cantos.extend(data['cantos'])

    if not all_cantos:
        print(f"  No data for {book_key}")
        return False

    # Sort by canto number
    all_cantos.sort(key=lambda c: c['number'])

    # Verify completeness
    missing = [n for n in range(1, info['count']+1) if not any(c['number']==n for c in all_cantos)]
    if missing:
        print(f"  WARNING: Missing cantos {missing}")

    # Validate Chinese content
    total_lines = sum(len(c.get('lines',[])) for c in all_cantos)
    zh_lines = sum(1 for c in all_cantos for l in c.get('lines',[]) if l and any(0x4e00 <= ord(ch) <= 0x9fff for ch in l))
    print(f"  {len(all_cantos)} cantos, {total_lines} lines, {zh_lines} Chinese lines")

    # Load English for fallback/validation
    en_path = os.path.join(OUT_DIR, f'{book_key}_en.json')
    with open(en_path) as f:
        en_data = json.load(f)
    en_map = {c['number']: c for c in en_data['cantos']}

    # Fill missing lines from English if needed
    for canto in all_cantos:
        en = en_map.get(canto['number'])
        if en and len(canto.get('lines', [])) < len(en['lines']) * 0.5:
            print(f"  WARNING: Canto {canto['number']} has too few lines, using English fallback")
            canto['lines'] = en['lines']

    result = {
        'id': book_key,
        'title': info['title'],
        'title_zh': info['title_zh'],
        'translator': 'Claude AI（基于 Longfellow 英译本）',
        'source': 'https://github.com/standardebooks/dante-alighieri_the-divine-comedy_henry-wadsworth-longfellow',
        'license': '公有领域英文原文，AI 中文翻译',
        'cantos': all_cantos,
    }

    out_path = os.path.join(OUT_DIR, f'{book_key}_zh.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  Written to {out_path}")
    return True

def main():
    books = sys.argv[1:] if sys.argv[1:] else list(BOOKS.keys())
    for book in books:
        print(f"\nMerging {book}...")
        merge_book(book)

if __name__ == '__main__':
    main()
