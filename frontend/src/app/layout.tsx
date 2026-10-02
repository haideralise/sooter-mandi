import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'SooterMandi - Thread Market Rates',
  description: 'Live thread rate tracking for Faisalabad thread market',
};

// Next 14 wants viewport as its own export, not a metadata key.
// Pinch-zoom is left enabled on purpose: brokers read dense rate tables on
// phones, and maximumScale/userScalable:false blocks them from zooming in.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-neutral-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
