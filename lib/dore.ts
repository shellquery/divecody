import type { BookId } from './types';
import doreRaw from '../public/data/dore.json';

const images = doreRaw as Record<string, Record<string, string>>;

export function getDorehImage(book: BookId, canto: number): string | undefined {
  return images[book]?.[String(canto)];
}
