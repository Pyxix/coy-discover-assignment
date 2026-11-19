import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coy — Discover',
  description: 'Coy SDE Assignment Part B — Mobile-first Discover Experience',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0b0e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#08090C] text-neutral-100 flex items-center justify-center min-h-[100dvh]">
        {children}
      </body>
    </html>
  );
}
