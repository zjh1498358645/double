import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小满 · 双人秘密基地",
  description: "一起玩，一起收集，把平凡的日子装进我们的小屋。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
