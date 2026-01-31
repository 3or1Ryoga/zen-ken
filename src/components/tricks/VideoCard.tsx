"use client";

import { Video } from "@/types";

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div
      className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group bg-gradient-to-b from-zen-text-primary/80 to-zen-text-primary shadow-card"
      onClick={onClick}
    >
      {/* Video Thumbnail Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
        {/* Kendama silhouette */}
        <svg viewBox="0 0 80 130" className="w-16 h-24 opacity-30">
          <circle cx="40" cy="25" r="20" fill="#E8DED0"/>
          <path d="M40 45 Q30 60 35 80" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
          <ellipse cx="40" cy="85" rx="12" ry="8" fill="#D4C4B0"/>
          <rect x="35" y="85" width="10" height="35" rx="2" fill="#D4C4B0"/>
        </svg>
      </div>

      {/* User Avatar */}
      <div className="absolute top-3 left-3">
        <div className="w-8 h-8 rounded-full bg-zen-accent-gold flex items-center justify-center text-white text-xs font-bold shadow-md">
          {video.username.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#2D2D2D">
            <polygon points="9,6 19,12 9,18" />
          </svg>
        </div>
      </div>

      {/* Player Label */}
      <div className="absolute top-3 right-3 bg-black/50 px-2 py-1 rounded text-xs text-white">
        PLAYER {video.id.replace('v', '')}
      </div>

      {/* User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white text-sm font-medium">@{video.username}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-white/70 text-xs">{video.views.toLocaleString()} 再生</span>
          <span className="text-white/70 text-xs">♡ {video.likes}</span>
        </div>
      </div>

      {/* Volume Icon */}
      <button
        className="absolute bottom-3 right-3 p-1.5 bg-black/40 rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          // Toggle mute
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      </button>
    </div>
  );
}
