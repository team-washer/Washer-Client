import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { Toaster } from '@/components/toaster';
import { Navbar } from '@/components/navbar';
import '@/lib/firebase';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Washer - 기숙사 세탁기 · 건조기 예약 시스템',
  description: '기숙사 세탁기 및 건조기 예약 시스템',
  icons: { icon: '/favicon.ico' },
  keywords: [
    'gsm',
    'Washer',
    '기숙사',
    '건조기 예약',
    '광주소프트웨어마이스터고등학교',
    '광주소프트웨어마이스터고',
    '광소마',
    '광주',
    '소프트웨어',
    '마이스터고',
    '마이스터고등학교',
    'GSM',
    'GwangjuSoftwareMeisterHighSchool',
    'SoftWare',
    'Gwangju',
    'MeisterHighSchool',
  ],
  creator: 'team-Washer',
  applicationName: 'Washer',
  publisher: 'team-Washer',
  openGraph: {
    title: 'Washer',
    description: '기숙사 세탁기 및 건조기 예약 서비스 ',
    siteName: 'Washer',
    images: ['/favicon.ico'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
