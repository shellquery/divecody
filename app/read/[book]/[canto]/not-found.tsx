import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4"
      style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      <h2 className="text-2xl" style={{ color: 'var(--accent)' }}>章节未找到</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
      <Link
        href="/read/inferno/1"
        className="px-4 py-2 rounded text-sm"
        style={{
          background: 'var(--bg-active)',
          color: 'var(--accent)',
          border: '1px solid var(--accent-dim)',
        }}
      >
        回到第一章 · Return to Canto I
      </Link>
    </div>
  );
}
