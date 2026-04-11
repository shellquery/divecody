'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import type { Section } from '@/lib/types';
import type { WorkWithSections } from '@/lib/content';

interface SidebarProps {
  sections: Section[];
  works: WorkWithSections[];
}

function WorkSwitcher({
  works,
  activeWorkId,
  lang,
  onNavigate,
}: {
  works: WorkWithSections[];
  activeWorkId: string;
  lang: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeWork = works.find((w) => w.id === activeWorkId);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-hover)]"
      >
        <span
          className="text-sm font-medium truncate"
          style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif' }}
        >
          {lang === 'zh'
            ? (activeWork?.title_zh ?? activeWork?.title)
            : activeWork?.title}
        </span>
        <span className="ml-2 shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 flex flex-col"
          style={{
            top: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {works.map((work) => {
            const isActive = work.id === activeWorkId;
            const firstSection = work.sections[0];
            const totalChapters = work.sections.reduce((n, s) => n + s.canto_count, 0);
            return (
              <Link
                key={work.id}
                href={firstSection ? `/read/${firstSection.id}/1?lang=${lang}` : '/'}
                onClick={() => { setOpen(false); onNavigate?.(); }}
                className="flex flex-col px-4 py-3 transition-colors hover:bg-[var(--bg-hover)]"
                style={{
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                }}
              >
                <span className="text-sm" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {lang === 'zh' ? (work.title_zh ?? work.title) : work.title}
                </span>
                <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {work.sections.map((s) => s.emoji).filter(Boolean).join(' ')}
                  {' · '}
                  {totalChapters} 章
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavLinks({
  sections,
  works,
  activeBook,
  activeCanto,
  lang,
  onNavigate,
}: {
  sections: Section[];
  works: WorkWithSections[];
  activeBook: string;
  activeCanto: number;
  lang: string;
  onNavigate?: () => void;
}) {
  const activeSection = sections.find((s) => s.id === activeBook);
  const cantoCount = activeSection?.canto_count ?? 34;
  const activeWorkId = activeSection?.work_id ?? '';

  // Only show sections from the current work
  const workSections = activeSection
    ? sections.filter((s) => s.work_id === activeSection.work_id)
    : sections;

  return (
    <>
      {/* Book switcher */}
      <WorkSwitcher works={works} activeWorkId={activeWorkId} lang={lang} onNavigate={onNavigate} />

      <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {lang === 'en' ? 'Volume' : '卷'}
        </p>
        <div className="flex flex-col gap-1">
          {workSections.map((section) => {
            const isActive = section.id === activeBook;
            return (
              <Link
                key={section.id}
                href={`/read/${section.id}/1?lang=${lang}`}
                onClick={onNavigate}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
                style={{
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border-light)' : '1px solid transparent',
                }}
              >
                <span>{section.emoji ?? ''}</span>
                <span>{lang === 'en' ? section.title : (section.title_zh ?? section.title)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-xs px-2 py-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {lang === 'en' ? 'Cantos' : '章节'}
        </p>
        {Array.from({ length: cantoCount }, (_, i) => i + 1).map((n) => {
          const isActive = n === activeCanto;
          const roman = toRoman(n);
          return (
            <Link
              key={n}
              href={`/read/${activeBook}/${n}?lang=${lang}`}
              onClick={onNavigate}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors"
              style={{
                background: isActive ? 'var(--bg-active)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <span
                className="text-xs font-mono"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', minWidth: '2.5rem' }}
              >
                {roman}
              </span>
              <span>{lang === 'en' ? `Canto ${roman}` : `第${n}章`}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default function Sidebar({ sections, works }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') setDesktopCollapsed(true);
  }, []);

  const params = useParams<{ book: string; canto: string }>();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') ?? 'zh';

  const activeBook = params.book;
  const activeCanto = parseInt(params.canto ?? '1', 10);
  const activeSection = sections.find((s) => s.id === activeBook);

  const navProps = { sections, works, activeBook, activeCanto, lang };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col h-full shrink-0"
        style={{
          width: desktopCollapsed ? '0' : '220px',
          minWidth: desktopCollapsed ? '0' : '220px',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          borderRight: desktopCollapsed ? 'none' : '1px solid var(--border)',
          transition: 'width 0.2s ease, min-width 0.2s ease',
        }}
      >
        <div
          className="sidebar-header flex items-center justify-between px-3 py-2 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {lang === 'en' ? 'Navigation' : '导航'}
          </span>
          <button
            onClick={() => { setDesktopCollapsed(true); localStorage.setItem('sidebarCollapsed', 'true'); }}
            className="p-1 rounded text-xs"
            style={{ color: 'var(--text-muted)' }}
            title={lang === 'en' ? 'Collapse sidebar' : '收起侧栏'}
          >
            ‹‹
          </button>
        </div>
        <NavLinks {...navProps} />
      </aside>

      {/* Desktop re-open button (when collapsed) */}
      {desktopCollapsed && (
        <button
          className="sidebar-reopen hidden md:flex fixed left-0 top-1/2 z-30 items-center justify-center"
          style={{
            transform: 'translateY(-50%)',
            width: '18px',
            height: '52px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderLeft: 'none',
            borderRadius: '0 6px 6px 0',
            color: 'var(--text-muted)',
            fontSize: '10px',
            cursor: 'pointer',
          }}
          onClick={() => { setDesktopCollapsed(false); localStorage.setItem('sidebarCollapsed', 'false'); }}
          title={lang === 'en' ? 'Expand sidebar' : '展开侧栏'}
        >
          ›
        </button>
      )}

      {/* Mobile: hamburger button */}
      <button
        className="mobile-menu-btn md:hidden fixed top-2.5 left-3 z-50 flex items-center justify-center w-9 h-9 rounded"
        style={{
          background: 'var(--bg-active)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-secondary)',
        }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
          <rect y="0"  width="16" height="1.75" rx="0.875" />
          <rect y="6"  width="16" height="1.75" rx="0.875" />
          <rect y="12" width="16" height="1.75" rx="0.875" />
        </svg>
      </button>

      {/* Mobile: backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <aside
        className="md:hidden fixed inset-y-0 left-0 z-50 flex flex-col"
        style={{
          width: '280px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s ease-in-out',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif', fontSize: '0.9rem' }}>
            {activeSection?.title_zh ?? activeSection?.title ?? 'DiveCody'}
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded text-lg leading-none"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>
        <NavLinks {...navProps} onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}

function toRoman(n: number): string {
  const ROMAN: Record<number, string> = {
    1:'I',   2:'II',   3:'III',  4:'IV',   5:'V',    6:'VI',   7:'VII',  8:'VIII', 9:'IX',  10:'X',
    11:'XI', 12:'XII', 13:'XIII',14:'XIV', 15:'XV',  16:'XVI', 17:'XVII',18:'XVIII',19:'XIX',20:'XX',
    21:'XXI',22:'XXII',23:'XXIII',24:'XXIV',25:'XXV',26:'XXVI',27:'XXVII',28:'XXVIII',29:'XXIX',30:'XXX',
    31:'XXXI',32:'XXXII',33:'XXXIII',34:'XXXIV',
  };
  return ROMAN[n] ?? String(n);
}
