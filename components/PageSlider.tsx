'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Canto, Lang } from '@/lib/types';

interface Props {
  children: React.ReactNode;
  prevCanto?: Canto;
  nextCanto?: Canto;
  prevHref?: string;
  nextHref?: string;
  lang: Lang;
  bookTitle: string;
  bookTitleZh: string;
}

export default function PageSlider({
  children, prevCanto, nextCanto, prevHref, nextHref, lang, bookTitle, bookTitleZh,
}: Props) {
  const router = useRouter();
  const [fontSize, setFontSize] = useState(16);
  useEffect(() => {
    const saved = localStorage.getItem('fontSize');
    if (saved) setFontSize(Number(saved));
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragX = useRef(0);
  const direction = useRef<'h' | 'v' | null>(null);
  const animating = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const _el: HTMLDivElement = el;

    function onTouchStart(e: TouchEvent) {
      if (animating.current) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      direction.current = null;
      dragX.current = 0;
    }

    function onTouchMove(e: TouchEvent) {
      if (!track || animating.current || direction.current === 'v') return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      if (!direction.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        direction.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }

      if (direction.current === 'h') {
        e.preventDefault();
        // Disable transitions so headers snap instantly to same state on both panels
        document.body.classList.add('swiping');
        document.body.classList.remove('scroll-down');
        let clamped = dx;
        if (dx > 0 && !prevHref) clamped = Math.min(dx * 0.15, 30);
        if (dx < 0 && !nextHref) clamped = Math.max(dx * 0.15, -30);
        dragX.current = clamped;
        track.style.transition = 'none';
        track.style.transform = `translateX(calc(-33.3333% + ${clamped}px))`;
      }
    }

    function onTouchEnd() {
      if (!track || direction.current !== 'h') return;
      const threshold = _el.offsetWidth * 0.28;
      const dx = dragX.current;
      animating.current = true;
      // Re-enable transitions for the swipe-complete animation
      document.body.classList.remove('swiping');
      track.style.transition = 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

      if (dx > threshold && prevHref) {
        track.style.transform = 'translateX(0%)';
        setTimeout(() => { router.push(prevHref!); animating.current = false; }, 320);
      } else if (dx < -threshold && nextHref) {
        track.style.transform = 'translateX(-66.6666%)';
        setTimeout(() => { router.push(nextHref!); animating.current = false; }, 320);
      } else {
        track.style.transform = 'translateX(-33.3333%)';
        setTimeout(() => { animating.current = false; }, 320);
      }
    }

    _el.addEventListener('touchstart', onTouchStart, { passive: true });
    _el.addEventListener('touchmove', onTouchMove, { passive: false });
    _el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      _el.removeEventListener('touchstart', onTouchStart);
      _el.removeEventListener('touchmove', onTouchMove);
      _el.removeEventListener('touchend', onTouchEnd);
    };
  }, [prevHref, nextHref, router]);

  const paneProps = { lang, fontSize, bookTitle, bookTitleZh };

  return (
    <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden">
      <div
        ref={trackRef}
        className="flex h-full"
        style={{ width: '300%', transform: 'translateX(-33.3333%)' }}
      >
        {/* Prev panel */}
        <div className="h-full overflow-hidden" style={{ width: '33.3333%' }}>
          {prevCanto
            ? <AdjacentPane canto={prevCanto} {...paneProps} />
            : <div style={{ background: 'var(--bg)', width: '100%', height: '100%' }} />}
        </div>
        {/* Current panel */}
        <div className="h-full overflow-hidden" style={{ width: '33.3333%' }}>
          {children}
        </div>
        {/* Next panel */}
        <div className="h-full overflow-hidden" style={{ width: '33.3333%' }}>
          {nextCanto
            ? <AdjacentPane canto={nextCanto} {...paneProps} />
            : <div style={{ background: 'var(--bg)', width: '100%', height: '100%' }} />}
        </div>
      </div>
    </div>
  );
}

function AdjacentPane({ canto, lang, fontSize, bookTitle, bookTitleZh }: {
  canto: Canto; lang: Lang; fontSize: number; bookTitle: string; bookTitleZh: string;
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Header — same class as CantoContent so scroll-hide applies equally */}
      <div
        className="canto-header flex items-center justify-between px-4 py-3 md:px-8 md:py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            {lang === 'en' ? bookTitle : bookTitleZh}
          </p>
          <h2 className="text-lg md:text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {lang === 'en' ? `Canto ${canto.roman}` : canto.title}
          </h2>
        </div>
      </div>

      {/* Text */}
      <div
        className="flex-1 overflow-y-auto canto-scroll"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {canto.lines.map((line, idx) => {
            if (!line.trim()) return <div key={idx} style={{ height: '0.75em' }} />;
            return (
              <p
                key={idx}
                style={{
                  color: 'var(--text-primary)',
                  marginBottom: '0.1em',
                  fontFamily: 'Georgia, Palatino Linotype, serif',
                  fontSize: '1em',
                  lineHeight: '1.85',
                  letterSpacing: lang === 'zh' ? '0.02em' : '0.01em',
                }}
              >
                {line.trim()}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
