'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('readingProgress');
      if (saved) {
        const { book, canto, lang } = JSON.parse(saved);
        if (book && canto) {
          router.replace(`/read/${book}/${canto}?lang=${lang ?? 'zh'}`);
          return;
        }
      }
    } catch {}
    router.replace('/read/inferno/1');
  }, [router]);

  return null;
}
