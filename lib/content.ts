import fs from 'fs';
import path from 'path';
import type { Book, BookId, Canto, Lang } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'parsed');

interface BookData extends Book {
  _placeholder?: boolean;
}

function loadBook(bookId: BookId, lang: Lang): BookData | null {
  const filePath = path.join(DATA_DIR, `${bookId}_${lang}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as BookData;
  } catch {
    return null;
  }
}

/** Returns whether the zh file is just a placeholder (not yet translated) */
export function isZhPlaceholder(bookId: BookId): boolean {
  const book = loadBook(bookId, 'zh');
  return book?._placeholder === true;
}

export function getBook(bookId: BookId, lang: Lang): Book | null {
  return loadBook(bookId, lang);
}

export function getCanto(bookId: BookId, cantoNum: number, lang: Lang): Canto | null {
  const book = loadBook(bookId, lang);
  if (!book) return null;
  return book.cantos.find((c) => c.number === cantoNum) ?? null;
}

export function getBookMeta(bookId: BookId, lang: Lang) {
  const book = loadBook(bookId, lang);
  if (!book) return null;
  return {
    id: book.id,
    title: book.title,
    title_zh: book.title_zh,
    translator: book.translator,
    canto_count: book.cantos.length,
    isPlaceholder: (book as BookData)._placeholder === true,
  };
}

export function listCantos(bookId: BookId, lang: Lang): Pick<Canto, 'number' | 'roman' | 'title'>[] {
  const book = loadBook(bookId, lang);
  if (!book) return [];
  return book.cantos.map(({ number, roman, title }) => ({ number, roman, title }));
}
