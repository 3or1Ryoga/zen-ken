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

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-zen-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-zen-border flex items-center justify-between">
              <div>
                <p className="font-medium text-zen-text-primary">@{selectedVideo.username}</p>
                <p className="text-sm text-zen-text-secondary">{trickName}</p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-zen-bg rounded-lg transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <p className="text-white text-sm">動画プレビュー</p>
              {/* In production, embed the actual video here */}
            </div>
            {selectedVideo.comment && (
              <div className="p-4">
                <p className="text-zen-text-secondary text-sm">{selectedVideo.comment}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
