"use client";

import { useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import VideoEditor, { EditedVideoData } from "@/components/video/VideoEditor";
import BottomNav from "@/components/layout/BottomNav";

const newTrickSchema = z.object({
  nameJa: z.string().min(1, "技名（日本語）を入力してください"),
  nameEn: z.string().min(1, "技名（英語）を入力してください"),
  category: z.string().min(1, "カテゴリーを選択してください"),
  difficulty: z.number().min(1).max(5),
  videoUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
});

type FormErrors = Partial<Record<keyof z.infer<typeof newTrickSchema>, string>>;

const DIFFICULTY_LABELS = ["初級", "中級", "上級", "達人"];
const CATEGORY_OPTIONS = [
  { value: "回転系", label: "回転系", icon: "🔄" },
  { value: "摺足系", label: "摺足系", icon: "👣" },
  { value: "静止系", label: "静止系", icon: "⚖️" },
  { value: "灯台系", label: "灯台系", icon: "🗼" },
  { value: "大皿系", label: "大皿系", icon: "🍽️" },
  { value: "小皿系", label: "小皿系", icon: "🥣" },
  { value: "とめけん系", label: "とめけん系", icon: "📍" },
  { value: "糸技系", label: "糸技系", icon: "🧵" },
];

function NewTrickForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trickSlug = searchParams.get("trick");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nameJa: "",
    nameEn: "",
    category: "",
    difficulty: 2,
    videoUrl: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [editedVideoData, setEditedVideoData] = useState<EditedVideoData | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's a video file
      if (!file.type.startsWith("video/")) {
        alert("動画ファイルを選択してください");
        return;
      }

      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert("ファイルサイズは100MB以下にしてください");
        return;
      }

      setVideoFile(file);
      setShowVideoEditor(true);
    }
  };

  // Handle video upload area click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle video editor close
  const handleEditorClose = () => {
    setShowVideoEditor(false);
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle video editor save
  const handleEditorSave = (data: EditedVideoData) => {
    setEditedVideoData(data);
    setShowVideoEditor(false);

    // Create preview URL
    const url = URL.createObjectURL(data.file);
    setVideoPreviewUrl(url);
  };

  // Remove uploaded video
  const handleRemoveVideo = () => {
    setVideoFile(null);
    setEditedVideoData(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      newTrickSchema.parse(formData);

      setIsSubmitting(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to success page
      router.push(`/post/success?name=${encodeURIComponent(formData.nameJa)}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-zen-bg pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-zen-bg/95 backdrop-blur-sm border-b border-zen-border">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-zen-accent-red text-lg">⬢</span>
              <h1 className="text-lg font-bold text-zen-text-primary" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                新技登録
              </h1>
            </div>
            <Link
              href="/"
              className="text-zen-text-secondary text-sm hover:text-zen-text-primary transition-colors"
            >
              キャンセル
            </Link>
          </div>
        </header>

        <div className="max-w-md mx-auto px-4">
          {/* Stats Banner */}
          <div className="my-6 bg-gradient-to-r from-zen-accent-gold/20 to-zen-accent-wood/10 rounded-xl p-4 text-center">
            <p className="text-sm text-zen-text-secondary">
              今月 <span className="font-bold text-zen-accent-wood text-lg">142</span> 個の技が披露されました
            </p>
          </div>

          {/* Motivation Section */}
          <div className="mb-8">
            <h2 className="heading-large text-zen-text-primary mb-2">
              競技者として
              <br />
              <span className="text-zen-accent-red">貢献する</span>
            </h2>
            <p className="text-zen-text-secondary text-sm">
              技を共有し、仲間と技術を磨き合おう。
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trick Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zen-text-primary mb-2">
                <span className="text-zen-accent-red">⬢</span>
                技の名称
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.nameJa}
                  onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })}
                  placeholder="例: 蹴裏回転 (Kickflip)"
                  className="w-full px-4 py-3 bg-zen-card border border-zen-border rounded-xl text-zen-text-primary placeholder:text-zen-text-muted focus:outline-none focus:ring-2 focus:ring-zen-accent-wood/50 focus:border-zen-accent-wood transition-all"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zen-bg rounded"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0A0A0" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
              {errors.nameJa && (
                <p className="mt-1 text-sm text-zen-accent-red">{errors.nameJa}</p>
              )}
            </div>

            {/* English Name */}
            <div>
              <label className="text-sm font-medium text-zen-text-secondary mb-2 block">
                英語名
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="例: Kickflip"
                className="w-full px-4 py-3 bg-zen-card border border-zen-border rounded-xl text-zen-text-primary placeholder:text-zen-text-muted focus:outline-none focus:ring-2 focus:ring-zen-accent-wood/50 focus:border-zen-accent-wood transition-all"
              />
              {errors.nameEn && (
                <p className="mt-1 text-sm text-zen-accent-red">{errors.nameEn}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zen-text-primary mb-3">
                <span className="text-zen-accent-red">⬢</span>
                分類
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.category === cat.value
                        ? "bg-zen-accent-red text-white"
                        : "bg-zen-card text-zen-text-secondary border border-zen-border hover:border-zen-accent-wood"
                    }`}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-zen-accent-red">{errors.category}</p>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium text-zen-text-secondary mb-3 block">
                修練度
                <span className="ml-2 px-2 py-0.5 bg-zen-accent-gold/20 text-zen-accent-wood rounded-md text-xs">
                  {DIFFICULTY_LABELS[formData.difficulty - 1] || "中級"}
                </span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: level })}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      formData.difficulty === level
                        ? "bg-zen-accent-gold text-white"
                        : "bg-zen-card text-zen-text-secondary border border-zen-border hover:border-zen-accent-gold"
                    }`}
                  >
                    {DIFFICULTY_LABELS[level - 1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zen-text-primary mb-3">
                <span className="text-zen-accent-red">⬢</span>
                映像の記録
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Video Preview or Upload Area */}
              {editedVideoData && videoPreviewUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video
                    src={videoPreviewUrl}
                    className="w-full aspect-video object-cover"
                    controls
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(editedVideoData.file);
                        setShowVideoEditor(true);
                      }}
                      className="p-2 bg-white/90 rounded-lg shadow-md hover:bg-white transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D2D2D" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="p-2 bg-zen-accent-red/90 rounded-lg shadow-md hover:bg-zen-accent-red transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  {/* Edit info badges */}
                  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                    {editedVideoData.mosaicEnabled && (
                      <span className="px-2 py-1 bg-zen-accent-red text-white text-xs rounded-md font-medium">
                        顔モザイク ON
                      </span>
                    )}
                    <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-md">
                      {(editedVideoData.endTime - editedVideoData.startTime).toFixed(1)}秒
                    </span>
                    {editedVideoData.volume < 100 && (
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-md">
                        音量: {editedVideoData.volume}%
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={handleUploadClick}
                  className="border-2 border-dashed border-zen-border rounded-xl p-8 text-center bg-zen-card/50 hover:border-zen-accent-wood hover:bg-zen-card/80 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-zen-bg rounded-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B6F47" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <p className="font-medium text-zen-text-primary mb-1">動画を読み込む</p>
                  <p className="text-xs text-zen-text-muted">60秒以内・高画質推奨</p>
                </div>
              )}

              {/* <div className="mt-3">
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="またはYouTube/Instagram URLを入力"
                  className="w-full px-4 py-3 bg-zen-card border border-zen-border rounded-xl text-zen-text-primary placeholder:text-zen-text-muted focus:outline-none focus:ring-2 focus:ring-zen-accent-wood/50 focus:border-zen-accent-wood transition-all text-sm"
                />
              </div>
              {errors.videoUrl && (
                <p className="mt-1 text-sm text-zen-accent-red">{errors.videoUrl}</p>
              )} */}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登録中...
                </>
              ) : (
                <>
                  技を登録する ✨
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-zen-text-muted mt-8 tracking-widest">
            TRADITIONAL ARTISAN SPIRIT
          </p>
        </div>
      </main>

      <BottomNav />

      {/* Video Editor Overlay */}
      {showVideoEditor && videoFile && (
        <VideoEditor
          videoFile={videoFile}
          onClose={handleEditorClose}
          onSave={handleEditorSave}
        />
      )}
    </>
  );
}

export default function NewTrickPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-zen-bg flex items-center justify-center">
        <div className="text-zen-text-secondary">読み込み中...</div>
      </main>
    }>
      <NewTrickForm />
    </Suspense>
  );
}
