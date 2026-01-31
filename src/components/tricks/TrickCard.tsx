"use client";

import Link from "next/link";
import { Trick, DIFFICULTY_COLORS } from "@/types";

interface TrickCardProps {
  trick: Trick;
}

export default function TrickCard({ trick }: TrickCardProps) {
  const difficultyColor = DIFFICULTY_COLORS[trick.difficultyLabel] || "bg-gray-100 text-gray-800";

  return (
    <Link href={`/tricks/${trick.slug}`} className="block">
      <div className="card overflow-hidden group cursor-pointer">
        {/* Image Container */}
        <div className="relative aspect-[4/5] bg-gradient-to-b from-zen-bg to-zen-divider">
          {/* Placeholder Kendama Image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-32 relative">
              {/* Simple Kendama Shape SVG */}
              <svg viewBox="0 0 80 130" className="w-full h-full opacity-60">
                {/* Ball */}
                <circle cx="40" cy="25" r="20" fill="#E8DED0" stroke="#C4B8A8" strokeWidth="2"/>
                {/* String */}
                <path d="M40 45 Q30 60 35 80" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
                {/* Ken (handle) */}
                <ellipse cx="40" cy="85" rx="12" ry="8" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
                <rect x="35" y="85" width="10" height="35" rx="2" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
                {/* Spike */}
                <path d="M40 70 L36 85 L44 85 Z" fill="#C4B4A0" stroke="#A89880" strokeWidth="1"/>
              </svg>
            </div>
          </div>

          {/* Difficulty Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-md ${difficultyColor}`}>
              {trick.difficultyLabel}
            </span>
          </div>

          {/* Bookmark Icon (placeholder) */}
          <button
            className="absolute top-3 right-3 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Implement bookmark functionality
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 bg-zen-accent-red rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <polygon points="9,6 19,12 9,18" />
              </svg>
            </div>
          </div>

          {/* Category Vertical Text */}
          <div className="absolute right-2 bottom-3">
            <span className="vertical-text text-xs text-zen-text-muted tracking-wider">
              {trick.category.replace('系', '')}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-3">
          <h3 className="font-bold text-zen-text-primary text-base" style={{ fontFamily: "'Noto Serif JP', serif" }}>
            {trick.nameJa}
          </h3>
          <p className="text-xs text-zen-text-muted mt-0.5 uppercase tracking-wide">
            {trick.nameEn}
          </p>
          <p className="text-xs text-zen-text-secondary mt-1">
            {trick.subcategory}
          </p>
        </div>
      </div>
    </Link>
  );
}
