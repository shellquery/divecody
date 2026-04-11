export type BookId = string; // Extensible — not a fixed union
export type Lang = 'en' | 'zh' | 'bilingual';

export interface Canto {
  number: number;
  roman: string;
  title: string;
  lines: string[];
}

export interface Book {
  id: string;
  title: string;
  title_zh: string;
  translator: string;
  source: string;
  license: string;
  cantos: Canto[];
}

export interface BookMeta {
  id: string;
  title: string;
  title_zh: string;
  canto_count: number;
  translator: string;
}

/** A section/volume within a work (e.g. "Inferno" inside "The Divine Comedy"). */
export interface Section {
  id: string;
  work_id: string;
  title: string;
  title_zh: string | null;
  number: number;
  canto_count: number;
  emoji: string | null;
  zh_placeholder: boolean;
  translator_en: string | null;
  translator_zh: string | null;
}

/** A top-level literary work. */
export interface Work {
  id: string;
  title: string;
  title_zh: string | null;
  author: string | null;
  author_zh: string | null;
}
