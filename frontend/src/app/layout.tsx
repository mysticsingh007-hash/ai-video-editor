'use client';

import React from 'react';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="AI-Powered Video Editor" />
        <title>AI Video Editor</title>
      </head>
      <body className="bg-dark-900 text-white antialiased">
        <div className="min-h-screen">
          {children}
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
