'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function ReadingProgressSaver() {
  const params = useParams<{ book: string; canto: string }>();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') ?? 'zh';

  useEffect(() => {
    const { book, canto } = params;
    if (book && canto) {
      localStorage.setItem('readingProgress', JSON.stringify({ book, canto, lang }));
    }
  }, [params.book, params.canto, lang]);

  return null;
}
