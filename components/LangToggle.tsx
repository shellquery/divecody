'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { Lang } from '@/lib/types';

const CYCLE: Lang[] = ['en', 'zh', 'bilingual'];

const LABELS: Record<Lang, string> = {
  en: 'EN',
  zh: '中文',
  bilingual: '双语',
};

const TITLES: Record<Lang, string> = {
  en: '切换为中文',
  zh: '切换为双语对照',
  bilingual: 'Switch to English',
};

export default function LangToggle({ current }: { current: Lang }) {
  const router = useRouter();
  const pathname = usePathname();

  function toggle() {
    const idx = CYCLE.indexOf(current);
    const next: Lang = CYCLE[(idx + 1) % CYCLE.length];
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
      title={TITLES[current]}
    >
      {CYCLE.map((lang, i) => (
        <span key={lang}>
          {i > 0 && <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>/</span>}
          <span style={{ color: current === lang ? 'var(--accent)' : 'var(--text-muted)' }}>
            {LABELS[lang]}
          </span>
        </span>
      ))}
    </button>
  );
}
