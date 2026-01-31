"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getAllTricks, searchTricks } from "@/lib/tricks";
import { Trick } from "@/types";
import BottomNav from "@/components/layout/BottomNav";

// Category icon mapping
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    "大皿系": "🍽️",
    "小皿系": "🥣",
    "中皿系": "🥏",
    "灯台系": "🗼",
    "飛行機系": "✈️",
    "とめけん系": "📍",
    "回転系": "🔄",
    "糸技系": "🧵",
  };
  return icons[category] || "🎯";
};

// Get category badge style
const getCategoryBadge = (category: string) => {
  const badges: Record<string, string> = {
    "大皿系": "基本",
    "小皿系": "基本",
    "中皿系": "基本",
    "灯台系": "静止",
    "飛行機系": "回転",
    "とめけん系": "刺し",
    "回転系": "回転",
    "糸技系": "糸技",
  };
  return badges[category] || "";
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const allTricks = getAllTricks();

  const searchResults = useMemo(() => {
    if (query.trim() === "") {
      return [];
    }
    return searchTricks(query);
  }, [query]);

  const recentTricks = allTricks.slice(0, 4);

  return (
    <main className="min-h-screen bg-zen-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zen-bg/95 backdrop-blur-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 hover:bg-zen-card rounded-lg transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-zen-text-primary" style={{ fontFamily: "'Noto Serif JP', serif" }}>
            技の検索
          </h1>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0A0A0" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="どの技を決めましたか？"
            className="w-full pl-12 pr-4 py-3 bg-zen-card border border-zen-border rounded-xl text-zen-text-primary placeholder:text-zen-text-muted focus:outline-none focus:ring-2 focus:ring-zen-accent-wood/50 focus:border-zen-accent-wood transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0A0A0" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search Results / Suggestions */}
      <div className="max-w-md mx-auto px-4">
        {query.trim() !== "" ? (
          <>
            <p className="text-sm text-zen-text-secondary mb-3">
              {searchResults.length > 0
                ? `${searchResults.length}件の結果`
                : "該当する技が見つかりません"}
            </p>
            <div className="space-y-2">
              {searchResults.map((trick) => (
                <SearchResultItem key={trick.id} trick={trick} />
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="mt-8 text-center">
                <p className="text-zen-text-secondary mb-4">
                  お探しの技が見つかりませんか？
                </p>
                <Link
                  href="/post/new"
                  className="inline-flex items-center gap-2 text-zen-accent-red font-medium"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  新しい技を登録する
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Recent Records */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-zen-text-secondary">最近の記録</h2>
                <span className="text-xs text-zen-accent-wood">表示</span>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {recentTricks.map((trick) => (
                  <Link
                    key={trick.id}
                    href={`/tricks/${trick.slug}`}
                    className="flex-shrink-0 w-20"
                  >
                    <div className="aspect-square bg-zen-card rounded-xl flex items-center justify-center shadow-card mb-2">
                      <span className="text-2xl">{getCategoryIcon(trick.category)}</span>
                    </div>
                    <p className="text-xs text-center text-zen-text-primary truncate">
                      {trick.nameJa}
                    </p>
                    <p className="text-[10px] text-center text-zen-text-muted uppercase">
                      {trick.nameEn}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* All Tricks List */}
            <div>
              <h2 className="text-sm font-medium text-zen-text-secondary mb-3">すべての技</h2>
              <div className="space-y-2">
                {allTricks.slice(0, 10).map((trick) => (
                  <SearchResultItem key={trick.id} trick={trick} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function SearchResultItem({ trick }: { trick: Trick }) {
  return (
    <Link
      href={`/tricks/${trick.slug}`}
      className="flex items-center gap-4 p-3 bg-zen-card rounded-xl hover:shadow-card transition-all"
    >
      <div className="w-12 h-12 bg-zen-bg rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-xl">{getCategoryIcon(trick.category)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zen-text-primary" style={{ fontFamily: "'Noto Serif JP', serif" }}>
          {trick.nameJa}
        </p>
        <p className="text-xs text-zen-text-muted uppercase">{trick.nameEn}</p>
      </div>
      <span className="px-2 py-1 text-xs bg-zen-bg rounded-md text-zen-text-secondary flex-shrink-0">
        {getCategoryBadge(trick.category)}
      </span>
    </Link>
  );
}
