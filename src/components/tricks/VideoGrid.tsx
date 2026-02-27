"use client";

import { useState } from "react";
import { Video } from "@/types";
import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: Video[];
  trickName: string;
}

export default function VideoGrid({ videos, trickName }: VideoGridProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-24 h-24 mb-4 opacity-50">
          <svg viewBox="0 0 80 130" className="w-full h-full">
            <circle cx="40" cy="25" r="20" fill="#E8DED0" stroke="#C4B8A8" strokeWidth="2"/>
            <path d="M40 45 Q30 60 35 80" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
            <ellipse cx="40" cy="85" rx="12" ry="8" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
            <rect x="35" y="85" width="10" height="35" rx="2" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
          </svg>
        </div>
        <p className="text-zen-text-secondary text-center font-medium mb-2">
          まだ誰も投稿していません
        </p>
        <p className="text-zen-text-muted text-sm text-center">
          最初の投稿者になりましょう！
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {videos.slice(0, 4).map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => setSelectedVideo(video)}
          />
        ))}
      </div>

      {/* Video Modal - TikTok style fullscreen */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setSelectedVideo(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Video area - portrait 9:16 */}
          <div
            className="relative w-full h-full max-w-sm mx-auto flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[9/16] bg-zinc-900">
              {/* Placeholder - replace with actual video player in production */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 80 130" className="w-20 h-28 opacity-20">
                  <circle cx="40" cy="25" r="20" fill="#E8DED0"/>
                  <path d="M40 45 Q30 60 35 80" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
                  <ellipse cx="40" cy="85" rx="12" ry="8" fill="#D4C4B0"/>
                  <rect x="35" y="85" width="10" height="35" rx="2" fill="#D4C4B0"/>
                </svg>
              </div>

              {/* Play icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <polygon points="9,6 19,12 9,18" />
                  </svg>
                </div>
              </div>

              {/* User info overlay - bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-semibold text-sm">@{selectedVideo.username}</p>
                <p className="text-white/70 text-xs mt-0.5">{trickName}</p>
                {selectedVideo.comment && (
                  <p className="text-white/80 text-xs mt-2">{selectedVideo.comment}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-white/60 text-xs">{selectedVideo.views.toLocaleString()} 再生</span>
                  <span className="text-white/60 text-xs">♡ {selectedVideo.likes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
