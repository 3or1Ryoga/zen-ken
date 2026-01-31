"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zen-bg/95 backdrop-blur-sm">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-zen-text-primary" style={{ fontFamily: "'Noto Serif JP', serif" }}>
            Zen Kendama
          </span>
        </Link>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-zen-card rounded-lg transition-colors"
          aria-label="メニュー"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-zen-card shadow-card-hover border-t border-zen-border">
          <nav className="max-w-md mx-auto py-4">
            <ul className="space-y-2 px-4">
              <li>
                <Link
                  href="/"
                  className="block py-3 px-4 rounded-lg hover:bg-zen-bg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  技一覧
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="block py-3 px-4 rounded-lg hover:bg-zen-bg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  技を検索
                </Link>
              </li>
              <li>
                <Link
                  href="/post/new"
                  className="block py-3 px-4 rounded-lg hover:bg-zen-bg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  新技を登録
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/signin"
                  className="block py-3 px-4 rounded-lg hover:bg-zen-bg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ログイン
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
