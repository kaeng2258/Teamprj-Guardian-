// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guardian Front",
  description: "Chat & e약은요",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const themeInitScript = `
(function() {
  try {
    var storedTheme = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = storedTheme || (prefersDark ? 'dark' : 'light');
    var storedText = localStorage.getItem('textSize');
    var largeText = storedText === 'large';
    var root = document.documentElement;
    var body = document.body;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    if (largeText) {
      root.classList.add('large-text');
      if (body) body.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
      if (body) body.classList.remove('large-text');
    }
  } catch (e) {}
})();
  `;
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitScript,
          }}
        />
      </head>
      <body
        className={`antialiased bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100`}
      >
        <main>{children}</main>
      </body>
    </html>
  );
}
