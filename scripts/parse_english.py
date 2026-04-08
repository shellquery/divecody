#!/usr/bin/env python3
"""
Parse Standard Ebooks XHTML files for Dante's Divine Comedy (Longfellow translation)
into structured JSON format.

Source: https://github.com/standardebooks/dante-alighieri_the-divine-comedy_henry-wadsworth-longfellow
License: Public Domain (Longfellow translation, 1867)
"""

import json
import re
import os
from xml.etree import ElementTree as ET

# Register namespaces
ET.register_namespace('', 'http://www.w3.org/1999/xhtml')
ET.register_namespace('epub', 'http://www.idpf.org/2007/ops')

XHTML_NS = 'http://www.w3.org/1999/xhtml'

BOOK_MAP = {
    'inferno': {
        'id': 'inferno',
        'title': 'Inferno',
        'title_zh': '地狱篇',
        'canto_count': 34,
        'file': 'inferno_en.xhtml',
    },
    'purgatorio': {
        'id': 'purgatorio',
        'title': 'Purgatorio',
        'title_zh': '炼狱篇',
        'canto_count': 33,
        'file': 'purgatorio_en.xhtml',
    },
    'paradiso': {
        'id': 'paradiso',
        'title': 'Paradiso',
        'title_zh': '天堂篇',
        'canto_count': 33,
        'file': 'paradiso_en.xhtml',
    },
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

def extract_text_from_element(elem):
    """Extract all text from an XML element, preserving line structure."""
    lines = []

    def process_elem(e, current_line_parts):
        # Get text before children
        if e.text and e.text.strip():
            current_line_parts.append(e.text.strip())

        for child in e:
            tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag

            if tag == 'br':
                # Line break - finalize current line
                if current_line_parts:
                    lines.append(' '.join(current_line_parts))
                    current_line_parts.clear()
                if child.tail and child.tail.strip():
                    current_line_parts.append(child.tail.strip())
            elif tag == 'span':
                # Get span text
                if child.text and child.text.strip():
                    current_line_parts.append(child.text.strip())
                # Process nested elements
                for sub in child:
                    stag = sub.tag.split('}')[-1] if '}' in sub.tag else sub.tag
                    if sub.text and sub.text.strip():
                        current_line_parts.append(sub.text.strip())
                    if sub.tail and sub.tail.strip():
                        current_line_parts.append(sub.tail.strip())
                if child.tail and child.tail.strip():
                    current_line_parts.append(child.tail.strip())
            elif tag in ('p', 'div'):
                # Block element - finalize current line first
                if current_line_parts:
                    lines.append(' '.join(current_line_parts))
                    current_line_parts.clear()
                process_elem(child, current_line_parts)
                if current_line_parts:
                    lines.append(' '.join(current_line_parts))
                    current_line_parts.clear()
                if child.tail and child.tail.strip():
                    current_line_parts.append(child.tail.strip())
            else:
                process_elem(child, current_line_parts)
                if child.tail and child.tail.strip():
                    current_line_parts.append(child.tail.strip())

    current_parts = []
    process_elem(elem, current_parts)
    if current_parts:
        lines.append(' '.join(current_parts))

    return [l for l in lines if l.strip()]


def parse_book(book_key, data_dir):
    info = BOOK_MAP[book_key]
    filepath = os.path.join(data_dir, info['file'])

    # Parse with namespace-aware ET
    tree = ET.parse(filepath)
    root = tree.getroot()

    book_ns = f'{{{XHTML_NS}}}'

    def find_all(elem, tag):
        return elem.findall(f'.//{book_ns}{tag}')

    def find_section_by_id(elem, sid):
        for section in find_all(elem, 'section'):
            if section.get('id') == sid:
                return section
        return None

    cantos = []

    for n in range(1, info['canto_count'] + 1):
        section_id = f'{book_key}-canto-{n}'
        section = find_section_by_id(root, section_id)

        if section is None:
            print(f"  WARNING: Section {section_id} not found")
            continue

        # Get title from h3
        h3 = section.find(f'.//{book_ns}h3')
        if h3 is not None:
            title_text = ''.join(h3.itertext()).strip()
        else:
            title_text = f'Canto {ROMAN[n]}'

        # Extract all verse lines from p elements
        all_lines = []
        paragraphs = section.findall(f'.//{book_ns}p')
        for p in paragraphs:
            p_lines = extract_text_from_element(p)
            if p_lines:
                # Add empty line between stanzas if there's content before
                if all_lines:
                    all_lines.append('')
                all_lines.extend(p_lines)

        # Clean up multiple blank lines
        cleaned = []
        prev_blank = False
        for line in all_lines:
            if not line.strip():
                if not prev_blank:
                    cleaned.append('')
                prev_blank = True
            else:
                cleaned.append(line)
                prev_blank = False

        # Remove leading/trailing blank lines
        while cleaned and not cleaned[0].strip():
            cleaned.pop(0)
        while cleaned and not cleaned[-1].strip():
            cleaned.pop()

        cantos.append({
            'number': n,
            'roman': ROMAN[n],
            'title': title_text,
            'lines': cleaned,
        })

        print(f"  Parsed {section_id}: {len(cleaned)} lines")

    return {
        'id': info['id'],
        'title': info['title'],
        'title_zh': info['title_zh'],
        'translator': 'Henry Wadsworth Longfellow (1867)',
        'source': 'https://github.com/standardebooks/dante-alighieri_the-divine-comedy_henry-wadsworth-longfellow',
        'license': 'Public Domain',
        'cantos': cantos,
    }


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    data_dir = os.path.join(project_dir, 'data')
    out_dir = os.path.join(project_dir, 'data', 'parsed')

    os.makedirs(out_dir, exist_ok=True)

    all_books = {}

    for book_key in ['inferno', 'purgatorio', 'paradiso']:
        print(f"\nParsing {book_key}...")
        book = parse_book(book_key, data_dir)
        all_books[book_key] = book

        out_path = os.path.join(out_dir, f'{book_key}_en.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(book, f, ensure_ascii=False, indent=2)
        print(f"  Saved to {out_path}")

    # Also save a combined index
    index = {
        book_key: {
            'id': book['id'],
            'title': book['title'],
            'title_zh': book['title_zh'],
            'canto_count': len(book['cantos']),
            'translator': book['translator'],
        }
        for book_key, book in all_books.items()
    }

    index_path = os.path.join(out_dir, 'index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"\nDone! Parsed {sum(len(b['cantos']) for b in all_books.values())} cantos total.")


if __name__ == '__main__':
    main()
