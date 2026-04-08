'use client';

import { useRef } from 'react';
import CopyButton from './CopyButton';
import type { Canto, Lang } from '@/lib/types';

interface Props {
  canto: Canto;
  book_title: string;
  book_title_zh: string;
  lang: Lang;
  translator: string;
}

export default function CantoContent({ canto, book_title, book_title_zh, lang, translator }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  function getTextToCopy() {
    const bookLabel = lang === 'zh' ? book_title_zh : book_title;
    const title = lang === 'zh'
      ? `但丁《神曲·${bookLabel}》${canto.title}\n`
      : `Dante's Divine Comedy — ${book_title}, Canto ${canto.roman}\n`;
    const content = canto.lines.join('\n');
    const attribution = lang === 'zh'
      ? `\n\n— ${translator}`
      : `\n\n— ${translator}`;
    return title + content + attribution;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Canto header */}
      <div
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            {lang === 'zh' ? book_title_zh : book_title}
          </p>
          <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {lang === 'zh' ? canto.title : `Canto ${canto.roman}`}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {canto.lines.filter(l => l.trim()).length}{lang === 'zh' ? ' 行' : ' lines'}
          </span>
          <CopyButton getText={getTextToCopy} />
        </div>
      </div>

      {/* Verse content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto fade-in"
        style={{ padding: '2rem 3rem 4rem' }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {canto.lines.map((line, idx) => {
            if (!line.trim()) {
              return <div key={idx} style={{ height: '0.75em' }} />;
            }

            // Detect indentation — lines starting with spaces/em-dash in English
            const isIndented = line.startsWith('  ') || line.startsWith('\u2003');
            const cleaned = line.trim();

            return (
              <p
                key={idx}
                className="text-base leading-relaxed select-text"
                style={{
                  color: 'var(--text-primary)',
                  paddingLeft: isIndented ? '1.5em' : '0',
                  marginBottom: '0.1em',
                  fontFamily: 'Georgia, Palatino Linotype, serif',
                  lineHeight: '1.85',
                  letterSpacing: lang === 'zh' ? '0.02em' : '0.01em',
                }}
              >
                {cleaned}
              </p>
            );
          })}
        </div>

        {/* Attribution footer */}
        <div
          className="mt-12 pt-6 text-sm text-center"
          style={{
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
            maxWidth: '680px',
            margin: '3rem auto 0',
          }}
        >
          <p>{translator}</p>
        </div>
      </div>
    </div>
  );
}
