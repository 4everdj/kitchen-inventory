import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { RealtimeSync } from '@/components/RealtimeSync';
import { AuthSync } from '@/components/AuthSync';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kitchen Inventory',
  description: 'Simple household food inventory — take a photo, track what you need to buy.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kitchen Inventory',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
<body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
<AuthSync />
<RealtimeSync />
<ServiceWorkerRegistration />

  <main className="flex-1 pb-20 max-w-lg mx-auto w-full">
    {children}
  </main>

  <BottomNav />
</body>
    </html>
  );
}
