'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { BOOKS, CANTO_COUNTS } from '@/lib/types';
import type { BookId } from '@/lib/types';

export default function Sidebar() {
  const params = useParams<{ book: string; canto: string }>();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') ?? 'zh';

  const activeBook = params.book as BookId;
  const activeCanto = parseInt(params.canto ?? '1', 10);

  const cantoCount = CANTO_COUNTS[activeBook] ?? 34;

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: '220px',
        minWidth: '220px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Book selector */}
      <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {lang === 'zh' ? '卷' : 'Volume'}
        </p>
        <div className="flex flex-col gap-1">
          {BOOKS.map((book) => {
            const isActive = book.id === activeBook;
            return (
              <Link
                key={book.id}
                href={`/read/${book.id}/1?lang=${lang}`}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
                style={{
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border-light)' : '1px solid transparent',
                }}
              >
                <span>{book.emoji}</span>
                <span>{lang === 'zh' ? book.title_zh : book.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Canto list */}
      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-xs px-2 py-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {lang === 'zh' ? '章节' : 'Cantos'}
        </p>
        {Array.from({ length: cantoCount }, (_, i) => i + 1).map((n) => {
          const isActive = n === activeCanto;
          const roman = toRoman(n);
          return (
            <Link
              key={n}
              href={`/read/${activeBook}/${n}?lang=${lang}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors"
              style={{
                background: isActive ? 'var(--bg-active)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <span
                className="text-xs font-mono"
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  minWidth: '2.5rem',
                }}
              >
                {roman}
              </span>
              <span>{lang === 'zh' ? `第${n}章` : `Canto ${roman}`}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function toRoman(n: number): string {
  const ROMAN: Record<number, string> = {
    1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII', 8:'VIII', 9:'IX', 10:'X',
    11:'XI', 12:'XII', 13:'XIII', 14:'XIV', 15:'XV', 16:'XVI', 17:'XVII', 18:'XVIII',
    19:'XIX', 20:'XX', 21:'XXI', 22:'XXII', 23:'XXIII', 24:'XXIV', 25:'XXV',
    26:'XXVI', 27:'XXVII', 28:'XXVIII', 29:'XXIX', 30:'XXX', 31:'XXXI', 32:'XXXII',
    33:'XXXIII', 34:'XXXIV',
  };
  return ROMAN[n] ?? String(n);
}
