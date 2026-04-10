'use client';

import { useRef, useState, useEffect } from 'react';
import CopyButton from './CopyButton';
import type { Canto, Lang } from '@/lib/types';

interface Props {
  canto: Canto;
  cantoEn?: Canto;
  book_title: string;
  book_title_zh: string;
  lang: Lang;
  translator: string;
  illustrationUrl?: string;
}

const VERSE_STYLE: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontFamily: 'Georgia, Palatino Linotype, serif',
  fontSize: '1em',
  lineHeight: '1.85',
  marginBottom: 0,
};

// Negative margin equal to width lets numbers float into the left padding
// so they don't reduce the reading area at all.
const NUM_W = '1.25rem';
const NUM_STYLE: React.CSSProperties = {
  display: 'inline-block',
  width: NUM_W,
  textAlign: 'right',
  paddingRight: '0.2rem',
  color: 'var(--text-muted)',
  fontSize: '0.6em',
  fontFamily: 'ui-monospace, monospace',
  userSelect: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  lineHeight: (1.85 / 0.6).toFixed(4),
  opacity: 0.7,
};

// Swap icon for bilingual order toggle
function SwapIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 16 7 4" />
      <polyline points="3 8 7 4 11 8" />
      <polyline points="17 8 17 20" />
      <polyline points="21 16 17 20 13 16" />
    </svg>
  );
}

export default function CantoContent({ canto, cantoEn, book_title, book_title_zh, lang, translator, illustrationUrl }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [biOrder, setBiOrder] = useState<'zh' | 'en'>('zh');
  const [immersive, setImmersive] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const lastClickRef = useRef<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fontSize');
    if (saved) setFontSize(Number(saved));
  }, []);

  function adjustFont(delta: number) {
    setFontSize(prev => {
      const next = Math.min(26, Math.max(12, prev + delta));
      localStorage.setItem('fontSize', String(next));
      return next;
    });
  }

  const isBilingual = lang === 'bilingual' && cantoEn;

  useEffect(() => {
    if (immersive) document.body.classList.add('immersive');
    else document.body.classList.remove('immersive');
    return () => { document.body.classList.remove('immersive'); };
  }, [immersive]);

  useEffect(() => {
    return () => { document.body.classList.remove('scroll-down'); };
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const current = e.currentTarget.scrollTop;
    const delta = current - lastScrollY.current;
    if (current <= 20) document.body.classList.remove('scroll-down');
    else if (delta > 6) document.body.classList.add('scroll-down');
    else if (delta < -6) document.body.classList.remove('scroll-down');
    lastScrollY.current = current;
  }

  function toggleLine(idx: number, shiftKey: boolean) {
    setSelectedLines(prev => {
      const next = new Set(prev);
      if (shiftKey && lastClickRef.current !== null) {
        const a = Math.min(lastClickRef.current, idx);
        const b = Math.max(lastClickRef.current, idx);
        for (let i = a; i <= b; i++) next.add(i);
      } else {
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        lastClickRef.current = idx;
      }
      return next;
    });
  }

  function buildLineNumMap(): Map<number, number> {
    const map = new Map<number, number>();
    let num = 0;
    if (isBilingual) {
      const len = Math.max(canto.lines.length, cantoEn!.lines.length);
      for (let i = 0; i < len; i++) {
        if ((canto.lines[i] ?? '').trim() || (cantoEn!.lines[i] ?? '').trim()) map.set(i, ++num);
      }
    } else {
      canto.lines.forEach((line, idx) => { if (line.trim()) map.set(idx, ++num); });
    }
    return map;
  }

  function positionLabel(lineNums?: number[]): string {
    if (lang === 'en') {
      const base = `${book_title}, Canto ${canto.roman}`;
      if (!lineNums?.length) return base;
      const lo = Math.min(...lineNums), hi = Math.max(...lineNums);
      return lo === hi ? `${base}, line ${lo}` : `${base}, lines ${lo}–${hi}`;
    }
    const base = `《神曲·${book_title_zh}》${canto.title}`;
    if (!lineNums?.length) return base;
    const lo = Math.min(...lineNums), hi = Math.max(...lineNums);
    return lo === hi ? `${base}，第 ${lo} 行` : `${base}，第 ${lo}—${hi} 行`;
  }

  function getTextToCopy() {
    if (isBilingual) {
      const header = `但丁《神曲·${book_title_zh}》${canto.title} / ${book_title} Canto ${canto.roman}\n\n`;
      const lines: string[] = [];
      const len = Math.max(canto.lines.length, cantoEn!.lines.length);
      for (let i = 0; i < len; i++) {
        const zh = canto.lines[i] ?? '';
        const en = cantoEn!.lines[i] ?? '';
        if (!zh.trim() && !en.trim()) { lines.push(''); continue; }
        const first = biOrder === 'zh' ? zh : en;
        const second = biOrder === 'zh' ? en : zh;
        if (first.trim()) lines.push(first.trim());
        if (second.trim()) lines.push(second.trim());
      }
      return header + lines.join('\n') + `\n\n${positionLabel()}`;
    }
    const bookLabel = lang === 'zh' ? book_title_zh : book_title;
    const title = lang === 'zh'
      ? `但丁《神曲·${bookLabel}》${canto.title}\n`
      : `Dante's Divine Comedy — ${book_title}, Canto ${canto.roman}\n`;
    return title + canto.lines.join('\n') + `\n\n${positionLabel()}`;
  }

  function copySelected() {
    const sorted = Array.from(selectedLines).sort((a, b) => a - b);
    const parts: string[] = [];

    if (isBilingual) {
      for (const i of sorted) {
        const zh = canto.lines[i] ?? '';
        const en = cantoEn!.lines[i] ?? '';
        const first = biOrder === 'zh' ? zh : en;
        const second = biOrder === 'zh' ? en : zh;
        if (first.trim()) parts.push(first.trim());
        if (second.trim()) parts.push(second.trim());
        parts.push('');
      }
    } else {
      for (const i of sorted) {
        const line = canto.lines[i] ?? '';
        if (line.trim()) parts.push(line.trim());
      }
    }

    const numMap = buildLineNumMap();
    const lineNums = sorted.map(i => numMap.get(i)).filter((n): n is number => n !== undefined);
    const text = parts.join('\n').trimEnd() + `\n\n${positionLabel(lineNums)}`;
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setSelectedLines(new Set());
    lastClickRef.current = null;
  }

  const copyLabel = lang === 'en' ? 'Copy' : '复制';
  const copiedLabel = lang === 'en' ? 'Copied' : '已复制';

  // ── Mono rendering ──────────────────────────────────────────────────────────
  function renderMono() {
    let lineNum = 0;
    return canto.lines.map((line, idx) => {
      if (!line.trim()) return <div key={idx} style={{ height: '0.75em' }} />;
      lineNum++;
      const selected = selectedLines.has(idx);
      const isIndented = line.startsWith('  ') || line.startsWith('\u2003');
      return (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            marginBottom: '0.1em',
            marginLeft: `-${NUM_W}`,
            borderRadius: '3px',
            background: selected ? 'rgba(196,163,90,0.1)' : 'transparent',
          }}
        >
          <span
            onClick={(e) => { e.stopPropagation(); toggleLine(idx, e.shiftKey); }}
            style={{ ...NUM_STYLE, color: selected ? 'var(--accent)' : 'var(--text-muted)' }}
            title={lang === 'en' ? 'Click to select' : '点击选中'}
          >
            {lineNum}
          </span>
          <p
            className="select-text"
            style={{
              ...VERSE_STYLE,
              flex: 1,
              paddingLeft: isIndented ? '1.5em' : '0',
              letterSpacing: lang === 'zh' ? '0.02em' : '0.01em',
            }}
          >
            {line.trim()}
          </p>
        </div>
      );
    });
  }

  // ── Bilingual rendering ─────────────────────────────────────────────────────
  function renderBilingual() {
    const len = Math.max(canto.lines.length, cantoEn!.lines.length);
    const elements: React.ReactNode[] = [];
    let lineNum = 0;

    for (let i = 0; i < len; i++) {
      const zh = canto.lines[i] ?? '';
      const en = cantoEn!.lines[i] ?? '';

      if (!zh.trim() && !en.trim()) {
        elements.push(<div key={`gap-${i}`} style={{ height: '1em' }} />);
        continue;
      }

      lineNum++;
      const selected = selectedLines.has(i);
      const firstLine = biOrder === 'zh' ? zh : en;
      const secondLine = biOrder === 'zh' ? en : zh;
      const isEnFirst = biOrder === 'en';

      elements.push(
        <div
          key={`pair-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '0.75em',
            marginLeft: `-${NUM_W}`,
            borderRadius: '3px',
            background: selected ? 'rgba(196,163,90,0.1)' : 'transparent',
          }}
        >
          <span
            onClick={(e) => { e.stopPropagation(); toggleLine(i, e.shiftKey); }}
            style={{
              ...NUM_STYLE,
              color: selected ? 'var(--accent)' : 'var(--text-muted)',
              paddingTop: '0.15em',
              lineHeight: undefined,
            }}
            title={lang === 'en' ? 'Click to select' : '点击选中'}
          >
            {lineNum}
          </span>
          <div style={{ flex: 1 }}>
            {firstLine.trim() && (
              <p
                className="select-text"
                style={{
                  ...VERSE_STYLE,
                  marginBottom: '0.15em',
                  letterSpacing: isEnFirst ? '0.01em' : '0.02em',
                  paddingLeft: (isEnFirst && (en.startsWith('  ') || en.startsWith('\u2003'))) ? '1.5em' : '0',
                }}
              >
                {firstLine.trim()}
              </p>
            )}
            {secondLine.trim() && (
              <p
                className="select-text"
                style={{
                  ...VERSE_STYLE,
                  lineHeight: '1.7',
                  opacity: 0.8,
                  letterSpacing: isEnFirst ? '0.02em' : '0.01em',
                  paddingLeft: (!isEnFirst && (en.startsWith('  ') || en.startsWith('\u2003'))) ? '1.5em' : '0',
                }}
              >
                {secondLine.trim()}
              </p>
            )}
          </div>
        </div>
      );
    }
    return elements;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Canto header */}
      <div
        className="canto-header flex items-center justify-between px-4 py-3 md:px-8 md:py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            {lang === 'en' ? book_title : book_title_zh}
          </p>
          <h2 className="text-lg md:text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {lang === 'en' ? `Canto ${canto.roman}` : canto.title}
            {isBilingual && (
              <span className="text-base font-normal ml-3" style={{ color: 'var(--text-muted)' }}>
                · Canto {canto.roman}
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isBilingual && (
            <button
              onClick={() => setBiOrder(o => o === 'zh' ? 'en' : 'zh')}
              className="flex items-center justify-center w-7 h-7 rounded"
              style={{ background: 'var(--bg-active)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
              title={biOrder === 'zh' ? '中↑英↓ · 点击切换' : '英↑中↓ · 点击切换'}
            >
              <SwapIcon />
            </button>
          )}
          <div className="flex items-center rounded overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
            <button onClick={() => adjustFont(-1)} className="flex items-center justify-center w-6 h-6 text-sm" style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }} title="减小字号">A</button>
            <span className="text-xs px-1.5 select-none" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', minWidth: '2rem', textAlign: 'center', lineHeight: '1.5rem' }}>{fontSize}</span>
            <button onClick={() => adjustFont(1)} className="flex items-center justify-center w-6 h-6" style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)', fontSize: '1rem' }} title="增大字号">A</button>
          </div>
          <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
            {canto.lines.filter(l => l.trim()).length}{lang === 'en' ? ' lines' : ' 行'}
          </span>
          <button
            onClick={() => setImmersive(v => !v)}
            className="flex items-center justify-center w-7 h-7 rounded text-sm"
            style={{ background: 'var(--bg-active)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }}
            title={immersive ? (lang === 'en' ? 'Exit immersive' : '退出沉浸阅读') : (lang === 'en' ? 'Immersive' : '沉浸阅读')}
          >
            {immersive ? '⊡' : '⊞'}
          </button>
          <CopyButton getText={getTextToCopy} label={copyLabel} copiedLabel={copiedLabel} iconOnly />
        </div>
      </div>

      {/* Floating immersive exit */}
      <button
        className="immersive-exit"
        onClick={() => setImmersive(false)}
        style={{ display: 'none', position: 'fixed', top: '1rem', right: '1rem', zIndex: 100, alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', background: 'var(--bg-active)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', cursor: 'pointer' }}
      >
        ⊡ {lang === 'en' ? 'Exit' : '退出沉浸'}
      </button>

      {/* Verse content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto fade-in canto-scroll"
        onScroll={handleScroll}
      >
        {/* Doré illustration banner */}
        {illustrationUrl && (
          <>
            <div
              role="button"
              aria-label="放大插图"
              onClick={() => setLightboxOpen(true)}
              style={{ position: 'relative', width: '100%', height: 'clamp(220px, 80vw, 380px)', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--bg)', cursor: 'zoom-in', display: 'flex', justifyContent: 'center' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={illustrationUrl}
                alt="Gustave Doré illustration"
                style={{
                  height: '100%',
                  width: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'center top',
                  filter: 'grayscale(45%) brightness(0.70) contrast(1.1)',
                  display: 'block',
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--bg) 35%, transparent) 55%, color-mix(in srgb, var(--bg) 92%, transparent) 88%, var(--bg) 100%)',
                pointerEvents: 'none',
              }} />
              {/* Faint canto label overlaid at bottom of banner */}
              <div style={{
                position: 'absolute',
                bottom: '0.75rem',
                left: 0,
                right: 0,
                textAlign: 'center',
                color: 'rgba(196,163,90,0.55)',
                fontSize: '0.65rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                userSelect: 'none',
                pointerEvents: 'none',
              }}>
                Gustave Doré · 1857
              </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
              <div
                onClick={() => setLightboxOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 1000,
                  backgroundColor: 'rgba(0,0,0,0.92)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'zoom-out',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={illustrationUrl}
                  alt="Gustave Doré illustration"
                  onClick={e => e.stopPropagation()}
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    filter: 'grayscale(20%) brightness(0.92) contrast(1.05)',
                    cursor: 'default',
                  }}
                />
                <button
                  onClick={() => setLightboxOpen(false)}
                  aria-label="关闭"
                  style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    color: '#fff', width: '2.2rem', height: '2.2rem',
                    borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </div>
            )}
          </>
        )}
        <div style={{ maxWidth: '680px', margin: '0 auto', fontSize: `${fontSize}px` }}>
          {isBilingual ? renderBilingual() : renderMono()}
        </div>
        <div className="pt-6 text-sm text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)', maxWidth: '680px', margin: '3rem auto 0' }}>
          <p>{translator}</p>
        </div>
      </div>

      {/* Floating line-selection copy bar */}
      {selectedLines.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.5rem 0.375rem 0.875rem',
            borderRadius: '9999px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            {selectedLines.size} {lang === 'en' ? (selectedLines.size > 1 ? 'lines' : 'line') : '行'}
          </span>
          <button
            onClick={copySelected}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'var(--accent)', color: '#0f0e0d', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {copyLabel}
          </button>
          <button
            onClick={() => { setSelectedLines(new Set()); lastClickRef.current = null; }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: 'var(--bg-active)', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
