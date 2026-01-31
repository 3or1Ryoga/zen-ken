import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "Zen Kendama - けん玉技辞典",
  description:
    "けん玉の技を検索・学習・共有できる技辞典。初級から達人まで、30以上の技を動画で解説。",
  keywords: ["けん玉", "剣玉", "kendama", "技", "辞典", "動画"],
  openGraph: {
    title: "Zen Kendama - 剣玉技辞典",
    description: "けん玉の技を検索・学習・共有できる技辞典",
    type: "website",
    locale: "ja_JP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-zen-bg min-h-screen">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
