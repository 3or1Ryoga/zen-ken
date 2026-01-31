"use client";

import { useState, useRef, useEffect } from "react";

interface VideoEditorProps {
  videoFile: File;
  onClose: () => void;
  onSave: (editedVideo: EditedVideoData) => void;
}

export interface EditedVideoData {
  file: File;
  startTime: number;
  endTime: number;
  volume: number;
  blurRegions: BlurRegion[];
  cropScale: number;
}

interface BlurRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type EditMode = "blur" | "cut" | "volume" | "crop" | null;

export default function VideoEditor({ videoFile, onClose, onSave }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [activeMode, setActiveMode] = useState<EditMode>(null);

  // Edit states
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(60);
  const [volume, setVolume] = useState(100);
  const [blurRegions, setBlurRegions] = useState<BlurRegion[]>([]);
  const [cropScale, setCropScale] = useState(1);
  const [videoUrl, setVideoUrl] = useState<string>("");

  // Create object URL for video preview
  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(Math.min(dur, 60)); // Max 60 seconds
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      // Stop at end time
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.pause();
        videoRef.current.currentTime = startTime;
        setIsPlaying(false);
      }
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
          videoRef.current.currentTime = startTime;
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Seek video
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Add blur region
  const addBlurRegion = () => {
    const newRegion: BlurRegion = {
      id: Date.now().toString(),
      x: 30,
      y: 20,
      width: 40,
      height: 40,
    };
    setBlurRegions([...blurRegions, newRegion]);
  };

  // Remove blur region
  const removeBlurRegion = (id: string) => {
    setBlurRegions(blurRegions.filter((r) => r.id !== id));
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol / 100;
    }
  };

  // Handle save
  const handleSave = () => {
    onSave({
      file: videoFile,
      startTime,
      endTime,
      volume,
      blurRegions,
      cropScale,
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-zen-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zen-border bg-zen-bg">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-zen-card rounded-lg transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-zen-text-primary" style={{ fontFamily: "'Noto Serif JP', serif" }}>
          編集
        </h1>
        <button
          onClick={handleSave}
          className="text-zen-accent-red font-medium hover:opacity-80 transition-opacity"
        >
          次へ
        </button>
      </header>

      {/* Video Preview */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zen-bg">
        <div
          className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-card-hover"
          style={{ transform: `scale(${cropScale})` }}
        >
          {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            playsInline
            muted={volume === 0}
          />
        ) : (
          <div className="flex items-center justify-center bg-gray-200">
            <p>動画を読み込んでください</p>
          </div>
        )}

          {/* Play Button Overlay */}
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#2D2D2D">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#2D2D2D">
                  <polygon points="9,6 19,12 9,18" />
                </svg>
              )}
            </div>
          </button>

          {/* Blur Regions */}
          {blurRegions.map((region) => (
            <div
              key={region.id}
              className="absolute border-2 border-dashed border-white bg-white/30 backdrop-blur-md cursor-move"
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (activeMode === "blur") {
                  removeBlurRegion(region.id);
                }
              }}
            >
              {activeMode === "blur" && (
                <button
                  className="absolute -top-2 -right-2 w-5 h-5 bg-zen-accent-red rounded-full flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBlurRegion(region.id);
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Pinch hint */}
        {activeMode === "crop" && (
          <p className="text-sm text-zen-text-muted mt-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8" />
              <path d="M3 3l6 6M3 3v4.8M3 3h4.8" />
            </svg>
            ピンチして拡大
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="px-4 py-3 bg-zen-card border-t border-zen-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zen-text-muted">動画の範囲を選択</span>
          <span className="text-sm font-medium text-zen-accent-red">
            {formatTime(currentTime)} / {formatTime(Math.min(duration, 60))}
          </span>
        </div>

        {/* Timeline Slider */}
        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-zen-divider rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:bg-zen-accent-red
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-md"
          />

          {/* Cut markers */}
          {activeMode === "cut" && (
            <>
              <div
                className="absolute top-0 h-2 bg-zen-accent-red/30 rounded-l-full pointer-events-none"
                style={{ left: 0, width: `${(startTime / duration) * 100}%` }}
              />
              <div
                className="absolute top-0 h-2 bg-zen-accent-red/30 rounded-r-full pointer-events-none"
                style={{ left: `${(endTime / duration) * 100}%`, right: 0 }}
              />
            </>
          )}
        </div>

        {/* Cut Time Inputs */}
        {activeMode === "cut" && (
          <div className="flex items-center justify-between mt-3 gap-4">
            <div className="flex-1">
              <label className="text-xs text-zen-text-muted block mb-1">開始</label>
              <input
                type="range"
                min={0}
                max={endTime - 1}
                step={0.1}
                value={startTime}
                onChange={(e) => setStartTime(parseFloat(e.target.value))}
                className="w-full h-1 bg-zen-divider rounded-full appearance-none cursor-pointer"
              />
              <span className="text-xs text-zen-text-secondary">{formatTime(startTime)}</span>
            </div>
            <div className="flex-1">
              <label className="text-xs text-zen-text-muted block mb-1">終了</label>
              <input
                type="range"
                min={startTime + 1}
                max={Math.min(duration, 60)}
                step={0.1}
                value={endTime}
                onChange={(e) => setEndTime(parseFloat(e.target.value))}
                className="w-full h-1 bg-zen-divider rounded-full appearance-none cursor-pointer"
              />
              <span className="text-xs text-zen-text-secondary">{formatTime(endTime)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mode-specific Controls */}
      {activeMode === "blur" && (
        <div className="px-4 py-3 bg-zen-accent-gold/10 border-t border-zen-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zen-text-secondary">
              タップしてぼかし領域を追加
            </p>
            <button
              onClick={addBlurRegion}
              className="px-4 py-2 bg-zen-accent-red text-white text-sm font-medium rounded-lg"
            >
              + 追加
            </button>
          </div>
          {blurRegions.length > 0 && (
            <p className="text-xs text-zen-text-muted mt-2">
              {blurRegions.length}個のぼかし領域（タップで削除）
            </p>
          )}
        </div>
      )}

      {activeMode === "volume" && (
        <div className="px-4 py-3 bg-zen-card border-t border-zen-border">
          <div className="flex items-center gap-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {volume === 0 ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  {volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
                </>
              )}
            </svg>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-zen-divider rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:bg-zen-accent-wood
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-sm text-zen-text-secondary w-12 text-right">{volume}%</span>
          </div>
        </div>
      )}

      {activeMode === "crop" && (
        <div className="px-4 py-3 bg-zen-card border-t border-zen-border">
          <div className="flex items-center gap-4">
            <span className="text-sm text-zen-text-secondary">サイズ</span>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.1}
              value={cropScale}
              onChange={(e) => setCropScale(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-zen-divider rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:bg-zen-accent-wood
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-sm text-zen-text-secondary w-12 text-right">{Math.round(cropScale * 100)}%</span>
          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      <nav className="flex items-center justify-around py-3 bg-zen-card border-t border-zen-border safe-area-inset-bottom">
        <ToolbarButton
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
            </svg>
          }
          label="ぼかし"
          isActive={activeMode === "blur"}
          onClick={() => setActiveMode(activeMode === "blur" ? null : "blur")}
        />
        <ToolbarButton
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
          }
          label="カット"
          isActive={activeMode === "cut"}
          onClick={() => setActiveMode(activeMode === "cut" ? null : "cut")}
        />
        <ToolbarButton
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          }
          label="音量"
          isActive={activeMode === "volume"}
          onClick={() => setActiveMode(activeMode === "volume" ? null : "volume")}
        />
        <ToolbarButton
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
              <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
            </svg>
          }
          label="画角"
          isActive={activeMode === "crop"}
          onClick={() => setActiveMode(activeMode === "crop" ? null : "crop")}
        />
      </nav>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
        isActive
          ? "text-zen-accent-red bg-zen-accent-red/10"
          : "text-zen-text-secondary hover:text-zen-text-primary"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
