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
  mosaicEnabled: boolean;
  mosaicIntensity: number;
  // クロップ領域（0-1の正規化座標）
  cropRect: {
    x: number;      // 左端からの位置 (0-1)
    y: number;      // 上端からの位置 (0-1)
    width: number;  // 幅 (0-1)
    height: number; // 高さ (0-1)
  };
}

type EditMode = "blur" | "cut" | "volume" | "crop" | null;

// API設定
const API_BASE_URL = process.env.NEXT_PUBLIC_MOSAIC_API_URL || "http://localhost:8000";

export default function VideoEditor({ videoFile, onClose, onSave }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const processedVideoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [activeMode, setActiveMode] = useState<EditMode>(null);

  // Edit states
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(60);
  const [volume, setVolume] = useState(100);
  // クロップ領域 (正規化座標 0-1)
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 1, height: 1 });
  const [videoUrl, setVideoUrl] = useState<string>("");

  // Mosaic states
  const [mosaicEnabled, setMosaicEnabled] = useState(false);
  const [mosaicIntensity, setMosaicIntensity] = useState(0.05); // ratio for API
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [processStats, setProcessStats] = useState<{
    faces_detected?: number;
    processed_frames?: number;
  } | null>(null);

  // API status
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Create object URL for video preview
  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // Check API availability on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          setApiAvailable(true);
        } else {
          setApiAvailable(false);
        }
      } catch {
        setApiAvailable(false);
      }
    };
    checkApi();
  }, []);

  // Process video with mosaic API
  const processVideoWithMosaic = async () => {
    setIsProcessing(true);
    setProcessError(null);

    try {
      const formData = new FormData();
      formData.append("file", videoFile);

      const response = await fetch(
        `${API_BASE_URL}/api/mosaic/video?mosaic_ratio=${mosaicIntensity}&padding=0.3`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "処理に失敗しました");
      }

      const result = await response.json();

      if (result.success) {
        // Download the processed video
        const downloadUrl = `${API_BASE_URL}${result.download_url}`;
        setProcessedVideoUrl(downloadUrl);
        setProcessStats({
          faces_detected: result.stats?.total_faces_detected,
          processed_frames: result.stats?.processed_frames,
        });
        setMosaicEnabled(true);
      }
    } catch (error) {
      console.error("Mosaic processing error:", error);
      setProcessError(error instanceof Error ? error.message : "処理中にエラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(Math.min(dur, 60));
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    const activeVideo = mosaicEnabled && processedVideoUrl ? processedVideoRef.current : videoRef.current;
    if (activeVideo) {
      setCurrentTime(activeVideo.currentTime);

      if (activeVideo.currentTime >= endTime) {
        activeVideo.pause();
        activeVideo.currentTime = startTime;
        setIsPlaying(false);
      }
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    const activeVideo = mosaicEnabled && processedVideoUrl ? processedVideoRef.current : videoRef.current;
    if (activeVideo) {
      if (isPlaying) {
        activeVideo.pause();
      } else {
        if (activeVideo.currentTime < startTime || activeVideo.currentTime >= endTime) {
          activeVideo.currentTime = startTime;
        }
        activeVideo.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Seek video
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const activeVideo = mosaicEnabled && processedVideoUrl ? processedVideoRef.current : videoRef.current;
    if (activeVideo) {
      activeVideo.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol / 100;
    }
    if (processedVideoRef.current) {
      processedVideoRef.current.volume = vol / 100;
    }
  };

  // Handle save
  const handleSave = () => {
    onSave({
      file: videoFile,
      startTime,
      endTime,
      volume,
      mosaicEnabled,
      mosaicIntensity,
      cropRect,
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  // Remove mosaic
  const removeMosaic = () => {
    setMosaicEnabled(false);
    setProcessedVideoUrl(null);
    setProcessStats(null);
  };

  // Get intensity label
  const getIntensityLabel = (ratio: number) => {
    if (ratio <= 0.03) return "粗い";
    if (ratio <= 0.07) return "標準";
    return "細かい";
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
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zen-bg overflow-hidden">
        <VideoPreviewWithCrop
          videoRef={videoRef}
          processedVideoRef={processedVideoRef}
          videoUrl={videoUrl}
          processedVideoUrl={processedVideoUrl}
          mosaicEnabled={mosaicEnabled}
          isProcessing={isProcessing}
          isPlaying={isPlaying}
          volume={volume}
          cropRect={cropRect}
          activeMode={activeMode}
          processStats={processStats}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTogglePlay={togglePlay}
          onCropRectChange={setCropRect}
        />
      </div>

      {/* Timeline */}
      <div className="px-4 py-3 bg-zen-card border-t border-zen-border">
        {activeMode === "cut" ? (
          <CutTimeline
            duration={duration}
            startTime={startTime}
            endTime={endTime}
            currentTime={currentTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onSeek={(time) => {
              const activeVideo = mosaicEnabled && processedVideoUrl ? processedVideoRef.current : videoRef.current;
              if (activeVideo) {
                activeVideo.currentTime = time;
                setCurrentTime(time);
              }
            }}
            formatTime={formatTime}
          />
        ) : (
          <>
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
            </div>
          </>
        )}
      </div>

      {/* Mode-specific Controls */}
      {activeMode === "blur" && (
        <div className="px-4 py-3 bg-zen-accent-gold/10 border-t border-zen-border">
          {/* API Status */}
          {apiAvailable === false && (
            <div className="mb-3 p-3 bg-zen-accent-red/10 border border-zen-accent-red/30 rounded-lg">
              <p className="text-sm text-zen-accent-red font-medium">APIサーバーに接続できません</p>
              <p className="text-xs text-zen-text-muted mt-1">
                ターミナルで以下を実行してください:
              </p>
              <code className="text-xs bg-zen-bg px-2 py-1 rounded mt-1 block">
                cd api && pip install -r requirements.txt && python main.py
              </code>
            </div>
          )}

          {/* Mosaic Controls */}
          {mosaicEnabled && processedVideoUrl ? (
            // Mosaic is applied
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">モザイク処理完了</span>
                </div>
                <button
                  onClick={removeMosaic}
                  className="text-xs text-zen-text-muted hover:text-zen-accent-red transition-colors"
                >
                  解除
                </button>
              </div>

              {processStats && (
                <p className="text-xs text-zen-text-muted text-center">
                  {processStats.processed_frames}フレーム処理 / {processStats.faces_detected}件の顔を検出
                </p>
              )}
            </div>
          ) : (
            // Mosaic not applied yet
            <div className="space-y-4">
              {/* Intensity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zen-text-secondary">モザイク強度</span>
                  <span className="text-sm font-medium text-zen-accent-wood">
                    {getIntensityLabel(mosaicIntensity)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.02}
                  max={0.15}
                  step={0.01}
                  value={mosaicIntensity}
                  onChange={(e) => setMosaicIntensity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zen-divider rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-4
                             [&::-webkit-slider-thumb]:h-4
                             [&::-webkit-slider-thumb]:bg-zen-accent-wood
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zen-text-muted">
                  <span>粗い</span>
                  <span>細かい</span>
                </div>
              </div>

              {/* Process Button */}
              <button
                onClick={processVideoWithMosaic}
                disabled={isProcessing || apiAvailable === false}
                className="w-full px-4 py-3 bg-zen-accent-red text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-zen-accent-red/90"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    処理中...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    顔を検出してモザイクをかける
                  </>
                )}
              </button>

              {processError && (
                <p className="text-xs text-zen-accent-red text-center">{processError}</p>
              )}

              <p className="text-xs text-zen-text-muted text-center">
                MediaPipe + OpenCV で動画全体の顔を検出・モザイク処理します
              </p>
            </div>
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-zen-text-secondary">
              四角形をドラッグして位置とサイズを調整
            </p>
            <button
              onClick={() => setCropRect({ x: 0, y: 0, width: 1, height: 1 })}
              className="text-xs text-zen-accent-wood hover:underline"
            >
              リセット
            </button>
          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      <nav className="flex items-center justify-around py-3 bg-zen-card border-t border-zen-border safe-area-inset-bottom">
        <ToolbarButton
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          }
          label="ぼかし"
          isActive={activeMode === "blur"}
          badge={mosaicEnabled ? "ON" : undefined}
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

// ビデオプレビュー + クロップ選択コンポーネント
function VideoPreviewWithCrop({
  videoRef,
  processedVideoRef,
  videoUrl,
  processedVideoUrl,
  mosaicEnabled,
  isProcessing,
  isPlaying,
  volume,
  cropRect,
  activeMode,
  processStats,
  onLoadedMetadata,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  onTogglePlay,
  onCropRectChange,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  processedVideoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl: string;
  processedVideoUrl: string | null;
  mosaicEnabled: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  volume: number;
  cropRect: { x: number; y: number; width: number; height: number };
  activeMode: EditMode;
  processStats: { faces_detected?: number; processed_frames?: number } | null;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onTogglePlay: () => void;
  onCropRectChange: (rect: { x: number; y: number; width: number; height: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  type DragMode = "move" | "resize-tl" | "resize-tr" | "resize-bl" | "resize-br" | "resize-t" | "resize-b" | "resize-l" | "resize-r" | null;
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, rect: cropRect });

  const MIN_SIZE = 0.1; // 最小サイズ（10%）

  // クロップモードでのドラッグ開始
  const handleCropDragStart = (mode: DragMode) =>
    (e: React.MouseEvent | React.TouchEvent) => {
      if (activeMode !== "crop") return;
      e.preventDefault();
      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setDragMode(mode);
      setDragStart({ x: clientX, y: clientY, rect: { ...cropRect } });
    };

  useEffect(() => {
    if (!dragMode || !containerRef.current) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rect = containerRef.current!.getBoundingClientRect();
      const deltaX = (clientX - dragStart.x) / rect.width;
      const deltaY = (clientY - dragStart.y) / rect.height;

      const { rect: startRect } = dragStart;
      let newRect = { ...startRect };

      if (dragMode === "move") {
        // 四角形を移動
        newRect.x = Math.max(0, Math.min(1 - startRect.width, startRect.x + deltaX));
        newRect.y = Math.max(0, Math.min(1 - startRect.height, startRect.y + deltaY));
      } else if (dragMode === "resize-br") {
        // 右下コーナー
        newRect.width = Math.max(MIN_SIZE, Math.min(1 - startRect.x, startRect.width + deltaX));
        newRect.height = Math.max(MIN_SIZE, Math.min(1 - startRect.y, startRect.height + deltaY));
      } else if (dragMode === "resize-tl") {
        // 左上コーナー
        const newWidth = Math.max(MIN_SIZE, startRect.width - deltaX);
        const newHeight = Math.max(MIN_SIZE, startRect.height - deltaY);
        newRect.x = Math.max(0, startRect.x + startRect.width - newWidth);
        newRect.y = Math.max(0, startRect.y + startRect.height - newHeight);
        newRect.width = Math.min(newWidth, startRect.x + startRect.width);
        newRect.height = Math.min(newHeight, startRect.y + startRect.height);
      } else if (dragMode === "resize-tr") {
        // 右上コーナー
        const newHeight = Math.max(MIN_SIZE, startRect.height - deltaY);
        newRect.width = Math.max(MIN_SIZE, Math.min(1 - startRect.x, startRect.width + deltaX));
        newRect.y = Math.max(0, startRect.y + startRect.height - newHeight);
        newRect.height = Math.min(newHeight, startRect.y + startRect.height);
      } else if (dragMode === "resize-bl") {
        // 左下コーナー
        const newWidth = Math.max(MIN_SIZE, startRect.width - deltaX);
        newRect.x = Math.max(0, startRect.x + startRect.width - newWidth);
        newRect.width = Math.min(newWidth, startRect.x + startRect.width);
        newRect.height = Math.max(MIN_SIZE, Math.min(1 - startRect.y, startRect.height + deltaY));
      } else if (dragMode === "resize-t") {
        // 上エッジ
        const newHeight = Math.max(MIN_SIZE, startRect.height - deltaY);
        newRect.y = Math.max(0, startRect.y + startRect.height - newHeight);
        newRect.height = Math.min(newHeight, startRect.y + startRect.height);
      } else if (dragMode === "resize-b") {
        // 下エッジ
        newRect.height = Math.max(MIN_SIZE, Math.min(1 - startRect.y, startRect.height + deltaY));
      } else if (dragMode === "resize-l") {
        // 左エッジ
        const newWidth = Math.max(MIN_SIZE, startRect.width - deltaX);
        newRect.x = Math.max(0, startRect.x + startRect.width - newWidth);
        newRect.width = Math.min(newWidth, startRect.x + startRect.width);
      } else if (dragMode === "resize-r") {
        // 右エッジ
        newRect.width = Math.max(MIN_SIZE, Math.min(1 - startRect.x, startRect.width + deltaX));
      }

      onCropRectChange(newRect);
    };

    const handleEnd = () => {
      setDragMode(null);
    };

    document.addEventListener("mousemove", handleMove, { passive: false });
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [dragMode, dragStart, onCropRectChange]);

  const isCropped = cropRect.x !== 0 || cropRect.y !== 0 || cropRect.width !== 1 || cropRect.height !== 1;

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-card-hover"
      >
        {/* Original Video */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className={`w-full h-full object-cover ${mosaicEnabled && processedVideoUrl ? "hidden" : ""}`}
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            playsInline
            muted={volume === 0}
          />
        )}

        {/* Processed Video with Mosaic */}
        {processedVideoUrl && mosaicEnabled && (
          <video
            ref={processedVideoRef}
            src={processedVideoUrl}
            className="w-full h-full object-cover"
            onTimeUpdate={onTimeUpdate}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            playsInline
            muted={volume === 0}
          />
        )}

        {/* クロップモード: 暗いオーバーレイ + 選択領域 */}
        {activeMode === "crop" && (
          <>
            {/* 暗いマスク（選択領域以外） */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 上部 */}
              <div
                className="absolute left-0 right-0 top-0 bg-black/60"
                style={{ height: `${cropRect.y * 100}%` }}
              />
              {/* 下部 */}
              <div
                className="absolute left-0 right-0 bottom-0 bg-black/60"
                style={{ height: `${(1 - cropRect.y - cropRect.height) * 100}%` }}
              />
              {/* 左部 */}
              <div
                className="absolute left-0 bg-black/60"
                style={{
                  top: `${cropRect.y * 100}%`,
                  height: `${cropRect.height * 100}%`,
                  width: `${cropRect.x * 100}%`,
                }}
              />
              {/* 右部 */}
              <div
                className="absolute right-0 bg-black/60"
                style={{
                  top: `${cropRect.y * 100}%`,
                  height: `${cropRect.height * 100}%`,
                  width: `${(1 - cropRect.x - cropRect.width) * 100}%`,
                }}
              />
            </div>

            {/* 選択領域 */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{
                left: `${cropRect.x * 100}%`,
                top: `${cropRect.y * 100}%`,
                width: `${cropRect.width * 100}%`,
                height: `${cropRect.height * 100}%`,
              }}
              onMouseDown={handleCropDragStart("move")}
              onTouchStart={handleCropDragStart("move")}
            >
              {/* グリッドライン */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
              </div>

              {/* コーナーハンドル */}
              <div
                className="absolute -top-2 -left-2 w-5 h-5 bg-white rounded-full cursor-nw-resize shadow-lg z-10"
                onMouseDown={handleCropDragStart("resize-tl")}
                onTouchStart={handleCropDragStart("resize-tl")}
              />
              <div
                className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full cursor-ne-resize shadow-lg z-10"
                onMouseDown={handleCropDragStart("resize-tr")}
                onTouchStart={handleCropDragStart("resize-tr")}
              />
              <div
                className="absolute -bottom-2 -left-2 w-5 h-5 bg-white rounded-full cursor-sw-resize shadow-lg z-10"
                onMouseDown={handleCropDragStart("resize-bl")}
                onTouchStart={handleCropDragStart("resize-bl")}
              />
              <div
                className="absolute -bottom-2 -right-2 w-5 h-5 bg-white rounded-full cursor-se-resize shadow-lg z-10"
                onMouseDown={handleCropDragStart("resize-br")}
                onTouchStart={handleCropDragStart("resize-br")}
              />

              {/* エッジハンドル（上下左右） */}
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-white rounded-full cursor-n-resize shadow-lg"
                onMouseDown={handleCropDragStart("resize-t")}
                onTouchStart={handleCropDragStart("resize-t")}
              />
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-white rounded-full cursor-s-resize shadow-lg"
                onMouseDown={handleCropDragStart("resize-b")}
                onTouchStart={handleCropDragStart("resize-b")}
              />
              <div
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-8 bg-white rounded-full cursor-w-resize shadow-lg"
                onMouseDown={handleCropDragStart("resize-l")}
                onTouchStart={handleCropDragStart("resize-l")}
              />
              <div
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 bg-white rounded-full cursor-e-resize shadow-lg"
                onMouseDown={handleCropDragStart("resize-r")}
                onTouchStart={handleCropDragStart("resize-r")}
              />
            </div>
          </>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
            <svg className="animate-spin w-12 h-12 text-white mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-white font-medium">顔検出・モザイク処理中...</p>
            <p className="text-white/70 text-sm mt-1">動画の長さによって時間がかかります</p>
          </div>
        )}

        {/* Play Button Overlay - クロップモード以外で表示 */}
        {!isProcessing && activeMode !== "crop" && (
          <button
            onClick={onTogglePlay}
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
        )}

        {/* Mosaic Status Indicator */}
        {mosaicEnabled && processedVideoUrl && activeMode !== "crop" && (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-zen-accent-red text-white text-xs font-bold rounded-full flex items-center gap-1.5 z-10">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            モザイク適用済
            {processStats?.faces_detected !== undefined && ` (${processStats.faces_detected}件)`}
          </div>
        )}

        {/* Crop Badge */}
        {isCropped && activeMode !== "crop" && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-zen-accent-wood text-white text-xs font-medium rounded z-10">
            クロップ適用
          </div>
        )}
      </div>

      {/* Crop hint */}
      {activeMode === "crop" && (
        <p className="text-sm text-zen-text-muted mt-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
            <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
          </svg>
          四角形をドラッグして移動、ハンドルで自由にサイズ変更
        </p>
      )}
    </>
  );
}

// カットタイムラインコンポーネント - TikTokスタイルのドラッグ可能なトリムUI
function CutTimeline({
  duration,
  startTime,
  endTime,
  currentTime,
  onStartTimeChange,
  onEndTimeChange,
  onSeek,
  formatTime,
}: {
  duration: number;
  startTime: number;
  endTime: number;
  currentTime: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
  onSeek: (time: number) => void;
  formatTime: (seconds: number) => string;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<"start" | "end" | "playhead" | null>(null);

  const maxDuration = Math.min(duration, 60);
  const minTrimDuration = 1; // 最小1秒

  // タッチ/マウス位置から時間を計算
  const getTimeFromPosition = (clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * maxDuration;
  };

  // ドラッグハンドラー
  const handleDragStart = (type: "start" | "end" | "playhead") => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  // グローバルマウス/タッチイベント
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const time = getTimeFromPosition(clientX);

      if (isDragging === "start") {
        const newStart = Math.max(0, Math.min(time, endTime - minTrimDuration));
        onStartTimeChange(Math.round(newStart * 10) / 10);
      } else if (isDragging === "end") {
        const newEnd = Math.max(startTime + minTrimDuration, Math.min(time, maxDuration));
        onEndTimeChange(Math.round(newEnd * 10) / 10);
      } else if (isDragging === "playhead") {
        const clampedTime = Math.max(startTime, Math.min(time, endTime));
        onSeek(Math.round(clampedTime * 10) / 10);
      }
    };

    const handleEnd = () => {
      setIsDragging(null);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, startTime, endTime, maxDuration, onStartTimeChange, onEndTimeChange, onSeek]);

  const startPercent = (startTime / maxDuration) * 100;
  const endPercent = (endTime / maxDuration) * 100;
  const currentPercent = (Math.min(currentTime, maxDuration) / maxDuration) * 100;
  const selectedDuration = endTime - startTime;

  return (
    <div className="space-y-3">
      {/* ヒントテキスト */}
      <div className="text-center">
        <span className="text-xs text-zen-text-muted">ハンドルをドラッグして範囲を選択</span>
      </div>

      {/* タイムライン */}
      <div
        ref={timelineRef}
        className="relative h-14 bg-zen-divider rounded-lg overflow-hidden select-none touch-none"
      >
        {/* 左側の除外エリア（暗く） */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-black/50 z-10"
          style={{ width: `${startPercent}%` }}
        />

        {/* 右側の除外エリア（暗く） */}
        <div
          className="absolute top-0 bottom-0 right-0 bg-black/50 z-10"
          style={{ width: `${100 - endPercent}%` }}
        />

        {/* 選択範囲 - グラデーション背景 */}
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-400/30 via-rose-300/20 to-rose-400/30"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />

        {/* 選択範囲の上下ボーダー */}
        <div
          className="absolute top-0 h-1 bg-rose-500 z-20"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />
        <div
          className="absolute bottom-0 h-1 bg-rose-500 z-20"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />

        {/* 左ハンドル */}
        <div
          className={`absolute top-0 bottom-0 w-5 bg-rose-500 cursor-ew-resize z-30 flex items-center justify-center rounded-l-md transition-colors ${
            isDragging === "start" ? "bg-rose-600" : "hover:bg-rose-600"
          }`}
          style={{ left: `calc(${startPercent}% - 10px)` }}
          onMouseDown={handleDragStart("start")}
          onTouchStart={handleDragStart("start")}
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
          </div>
        </div>

        {/* 右ハンドル */}
        <div
          className={`absolute top-0 bottom-0 w-5 bg-rose-500 cursor-ew-resize z-30 flex items-center justify-center rounded-r-md transition-colors ${
            isDragging === "end" ? "bg-rose-600" : "hover:bg-rose-600"
          }`}
          style={{ left: `calc(${endPercent}% - 10px)` }}
          onMouseDown={handleDragStart("end")}
          onTouchStart={handleDragStart("end")}
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
          </div>
        </div>

        {/* 再生ヘッド */}
        <div
          className={`absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-40 shadow-lg ${
            isDragging === "playhead" ? "w-1.5" : ""
          }`}
          style={{ left: `${currentPercent}%`, transform: "translateX(-50%)" }}
          onMouseDown={handleDragStart("playhead")}
          onTouchStart={handleDragStart("playhead")}
        >
          {/* 再生ヘッドの三角形インジケーター */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
        </div>
      </div>

      {/* 時間表示 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zen-text-muted">開始</span>
          <span className="text-sm font-medium text-rose-500">{formatTime(startTime)}</span>
        </div>

        <div className="flex items-center gap-1 px-3 py-1 bg-rose-500/10 rounded-full">
          <span className="text-sm font-bold text-rose-500">{selectedDuration.toFixed(1)}秒</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zen-text-muted">終了</span>
          <span className="text-sm font-medium text-rose-500">{formatTime(endTime)}</span>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  isActive,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
        isActive
          ? "text-zen-accent-red bg-zen-accent-red/10"
          : "text-zen-text-secondary hover:text-zen-text-primary"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-zen-accent-red text-white text-[10px] font-bold rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
