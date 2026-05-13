import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GCoin Admin Panel',
  description: 'Admin dashboard for GCoin stablecoin management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}