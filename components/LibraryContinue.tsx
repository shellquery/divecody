'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Progress {
  book: string;
  canto: number;
  lang: string;
  bookTitle?: string;
}

export default function LibraryContinue() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('readingProgress');
      if (saved) {
        const p = JSON.parse(saved);
        if (p?.book && p?.canto) setProgress(p);
      }
    } catch {}
  }, []);

  if (!progress) return null;

  return (
    <Link
      href={`/read/${progress.book}/${progress.canto}?lang=${progress.lang ?? 'zh'}`}
      className="flex items-center gap-4 px-5 py-4 rounded-lg transition-colors"
      style={{
        background: 'var(--bg-active)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full text-lg"
        style={{ background: 'rgba(196,163,90,0.15)', color: 'var(--accent)' }}
      >
        ▶
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
          继续阅读 · Continue
        </p>
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {progress.book} · Chapter {progress.canto}
        </p>
      </div>
      <span className="ml-auto shrink-0 text-lg" style={{ color: 'var(--accent)' }}>›</span>
    </Link>
  );
}
