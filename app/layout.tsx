import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '神曲 · Divine Comedy',
  description: '但丁《神曲》中英文阅读 — Dante\'s Divine Comedy in Chinese and English',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
