export type BookId = 'inferno' | 'purgatorio' | 'paradiso';
export type Lang = 'en' | 'zh';

export interface Canto {
  number: number;
  roman: string;
  title: string;
  lines: string[];
}

export interface Book {
  id: BookId;
  title: string;
  title_zh: string;
  translator: string;
  source: string;
  license: string;
  cantos: Canto[];
}

export interface BookMeta {
  id: BookId;
  title: string;
  title_zh: string;
  canto_count: number;
  translator: string;
}

export const BOOKS: { id: BookId; title: string; title_zh: string; emoji: string }[] = [
  { id: 'inferno',    title: 'Inferno',    title_zh: '地狱篇', emoji: '🔥' },
  { id: 'purgatorio', title: 'Purgatorio', title_zh: '炼狱篇', emoji: '⛰️' },
  { id: 'paradiso',   title: 'Paradiso',   title_zh: '天堂篇', emoji: '✨' },
];

export const CANTO_COUNTS: Record<BookId, number> = {
  inferno: 34,
  purgatorio: 33,
  paradiso: 33,
};
