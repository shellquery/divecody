'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { Lang } from '@/lib/types';

export default function LangToggle({ current }: { current: Lang }) {
  const router = useRouter();
  const pathname = usePathname();

  function toggle() {
    const next: Lang = current === 'en' ? 'zh' : 'en';
    // Swap lang param in URL: /read/book/canto?lang=X
    const url = new URL(pathname, 'http://x');
    url.searchParams.set('lang', next);
    router.push(`${pathname}?lang=${next}`);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
      style={{
        background: 'var(--bg-active)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-light)',
      }}
      title={current === 'en' ? '切换为中文' : 'Switch to English'}
    >
      <span style={{ color: current === 'en' ? 'var(--accent)' : 'var(--text-muted)' }}>EN</span>
      <span style={{ color: 'var(--text-muted)' }}>/</span>
      <span style={{ color: current === 'zh' ? 'var(--accent)' : 'var(--text-muted)' }}>中文</span>
    </button>
  );
}
