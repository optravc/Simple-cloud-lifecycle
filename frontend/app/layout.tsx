import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Simple Cloud Lifecycle',
  description: 'Manage and optimize your cloud infrastructure securely.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
