#!/usr/bin/env python3
"""
Translate Dante's Divine Comedy (Longfellow English) to Chinese using Claude API.
Produces data/parsed/{inferno,purgatorio,paradiso}_zh.json
"""

import json
import os
import sys
import time

import anthropic

client = anthropic.Anthropic()

ROMAN = {
    1:'I', 2:'II', 3:'III', 4:'IV', 5:'V',
    6:'VI', 7:'VII', 8:'VIII', 9:'IX', 10:'X',
    11:'XI', 12:'XII', 13:'XIII', 14:'XIV', 15:'XV',
    16:'XVI', 17:'XVII', 18:'XVIII', 19:'XIX', 20:'XX',
    21:'XXI', 22:'XXII', 23:'XXIII', 24:'XXIV', 25:'XXV',
    26:'XXVI', 27:'XXVII', 28:'XXVIII', 29:'XXIX', 30:'XXX',
    31:'XXXI', 32:'XXXII', 33:'XXXIII', 34:'XXXIV',
}

BOOK_ZH = {
    'inferno': ('Inferno', '地狱篇'),
    'purgatorio': ('Purgatorio', '炼狱篇'),
    'paradiso': ('Paradiso', '天堂篇'),
}

SYSTEM_PROMPT = """你是一位精通意大利语与中文的文学翻译家，擅长翻译中世纪诗歌。
你的任务是将但丁《神曲》朗费罗英译版翻译成流畅、典雅的现代中文散文诗。

翻译要求：
1. 保持每行诗的独立性，原文一行对应译文一行
2. 语言典雅而不晦涩，适合现代读者
3. 保留原文的意象和情感深度
4. 专有名词（人名、地名）使用通行中文译名
5. 只输出翻译结果，每行一句，不加任何解释或注释
6. 空行保持为空行"""


def translate_canto(book_title_en: str, canto_num: int, canto_roman: str, lines: list[str]) -> list[str]:
    """Translate one canto from English to Chinese."""
    # Build the English text
    en_text = '\n'.join(lines)

    prompt = f"""请将以下但丁《神曲·{book_title_en}》第{canto_roman}章（共{len([l for l in lines if l.strip()])}行诗）从英文翻译成中文：

{en_text}

要求：直接输出中文译文，每行英文对应一行中文，空行保持为空行，不加任何解释。"""

    try:
        message = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=4096,
            messages=[{'role': 'user', 'content': prompt}],
            system=SYSTEM_PROMPT,
        )
        zh_text = message.content[0].text.strip()
        zh_lines = zh_text.split('\n')

        # Ensure blank lines are preserved
        result = []
        en_idx = 0
        zh_idx = 0
        while en_idx < len(lines) and zh_idx < len(zh_lines):
            en_line = lines[en_idx]
            zh_line = zh_lines[zh_idx]
            if not en_line.strip():
                result.append('')
                en_idx += 1
                # Also skip corresponding blank in zh if present
                if zh_idx < len(zh_lines) and not zh_lines[zh_idx].strip():
                    zh_idx += 1
            else:
                result.append(zh_line.strip() if zh_line.strip() else zh_lines[zh_idx] if zh_idx < len(zh_lines) else '')
                en_idx += 1
                zh_idx += 1

        # Add any remaining zh lines
        while en_idx < len(lines):
            result.append('' if not lines[en_idx].strip() else '')
            en_idx += 1

        return result

    except Exception as e:
        print(f'    ERROR: {e}', file=sys.stderr)
        return [f'（翻译出错：{e}）'] + lines


def translate_book(book_key: str, data_dir: str, out_dir: str, resume: bool = True):
    """Translate all cantos in one book."""
    en_path = os.path.join(data_dir, f'{book_key}_en.json')
    out_path = os.path.join(out_dir, f'{book_key}_zh.json')

    with open(en_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)

    title_en, title_zh = BOOK_ZH[book_key]

    # Load existing progress if resuming
    if resume and os.path.exists(out_path):
        with open(out_path, 'r', encoding='utf-8') as f:
            zh_data = json.load(f)
        done_nums = {c['number'] for c in zh_data.get('cantos', [])}
        zh_cantos = zh_data.get('cantos', [])
    else:
        done_nums = set()
        zh_cantos = []
        zh_data = {
            'id': book_key,
            'title': title_en,
            'title_zh': title_zh,
            'translator': 'Claude AI（基于 Longfellow 英译本）',
            'source': 'https://github.com/standardebooks/dante-alighieri_the-divine-comedy_henry-wadsworth-longfellow',
            'license': '公有领域英文原文，AI 中文翻译',
            'cantos': zh_cantos,
        }

    total = len(en_data['cantos'])
    for canto in en_data['cantos']:
        n = canto['number']
        roman = canto['roman']
        if n in done_nums:
            print(f'  [{n}/{total}] Canto {roman} - already done, skipping')
            continue

        print(f'  [{n}/{total}] Translating Canto {roman}...', end=' ', flush=True)
        zh_lines = translate_canto(title_en, n, roman, canto['lines'])
        print(f'OK ({len(zh_lines)} lines)')

        zh_canto = {
            'number': n,
            'roman': roman,
            'title': f'第{roman}章',
            'lines': zh_lines,
        }
        zh_cantos.append(zh_canto)
        zh_cantos.sort(key=lambda c: c['number'])

        # Save after each canto
        zh_data['cantos'] = zh_cantos
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(zh_data, f, ensure_ascii=False, indent=2)

        time.sleep(0.3)  # Brief pause between API calls

    print(f'  Done! {out_path}')
    return zh_data


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    data_dir = os.path.join(project_dir, 'data', 'parsed')
    out_dir = data_dir

    books = sys.argv[1:] if len(sys.argv) > 1 else ['inferno', 'purgatorio', 'paradiso']

    for book_key in books:
        if book_key not in BOOK_ZH:
            print(f'Unknown book: {book_key}')
            continue
        print(f'\nTranslating {book_key}...')
        translate_book(book_key, data_dir, out_dir, resume=True)

    print('\nAll done!')


if __name__ == '__main__':
    main()
