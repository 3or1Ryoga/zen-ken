"use client";

import { Trick } from "@/types";
import TrickCard from "./TrickCard";

interface TrickGridProps {
  tricks: Trick[];
}

export default function TrickGrid({ tricks }: TrickGridProps) {
  if (tricks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 mb-4 opacity-50">
          <svg viewBox="0 0 80 130" className="w-full h-full">
            <circle cx="40" cy="25" r="20" fill="#E8DED0" stroke="#C4B8A8" strokeWidth="2"/>
            <path d="M40 45 Q30 60 35 80" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
            <ellipse cx="40" cy="85" rx="12" ry="8" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
            <rect x="35" y="85" width="10" height="35" rx="2" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
          </svg>
        </div>
        <p className="text-zen-text-secondary text-center">
          この技カテゴリーはまだ登録されていません
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,160px))] gap-4 justify-center max-w-7xl mx-auto">
        {tricks.map((trick) => (
          <TrickCard key={trick.id} trick={trick} />
        ))}
      </div>
    </div>
  );
}
