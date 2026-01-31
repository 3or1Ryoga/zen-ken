"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trickName = searchParams.get("name") || "新しい技";
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-zen-bg flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="heading-large text-zen-text-primary mb-2">
          投稿完了！ 🎉
        </h1>

        {/* Trick Name */}
        <p className="text-xl text-zen-accent-wood font-medium mb-6" style={{ fontFamily: "'Noto Serif JP', serif" }}>
          {trickName}
        </p>

        {/* Thumbnail Placeholder */}
        <div className="w-32 h-32 mx-auto mb-8 bg-zen-card rounded-xl shadow-card flex items-center justify-center">
          <svg viewBox="0 0 80 130" className="w-16 h-24 opacity-60">
            <circle cx="40" cy="25" r="20" fill="#E8DED0" stroke="#C4B8A8" strokeWidth="2"/>
            <path d="M40 45 Q30 60 35 80" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
            <ellipse cx="40" cy="85" rx="12" ry="8" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
            <rect x="35" y="85" width="10" height="35" rx="2" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Auto Redirect Notice */}
        <p className="text-sm text-zen-text-muted mb-6">
          {countdown}秒後に自動でホームに戻ります...
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            技一覧を見る
          </Link>
          <Link
            href="/post/new"
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            別の技を登録する
          </Link>
        </div>

        {/* Share Buttons (Coming Soon) */}
        <div className="mt-8 pt-6 border-t border-zen-border">
          <p className="text-xs text-zen-text-muted mb-3">SNSでシェア（Coming Soon）</p>
          <div className="flex justify-center gap-3">
            <button disabled className="p-3 bg-zen-card rounded-xl opacity-50 cursor-not-allowed">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#E1306C">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </button>
            <button disabled className="p-3 bg-zen-card rounded-xl opacity-50 cursor-not-allowed">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </button>
            <button disabled className="p-3 bg-zen-card rounded-xl opacity-50 cursor-not-allowed">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-zen-bg flex items-center justify-center">
        <div className="text-zen-text-secondary">読み込み中...</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
