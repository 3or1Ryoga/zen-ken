import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrickBySlug, getAllTricks } from "@/lib/tricks";
import { DIFFICULTY_COLORS } from "@/types";
import VideoGrid from "@/components/tricks/VideoGrid";

interface TrickDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const tricks = getAllTricks();
  return tricks.map((trick) => ({
    slug: trick.slug,
  }));
}

export async function generateMetadata({ params }: TrickDetailPageProps) {
  const { slug } = await params;
  const trick = getTrickBySlug(slug);

  if (!trick) {
    return {
      title: "技が見つかりません - Zen Kendama",
    };
  }

  return {
    title: `${trick.nameJa} (${trick.nameEn}) - Zen Kendama`,
    description: `${trick.nameJa}の剣玉技を学ぼう。複数の実演動画で詳しく解説。難易度: ${trick.difficultyLabel}`,
    openGraph: {
      title: `${trick.nameJa} - 剣玉技辞典`,
      description: `${trick.videos.length}人の実演動画を見る`,
    },
  };
}

export default async function TrickDetailPage({ params }: TrickDetailPageProps) {
  const { slug } = await params;
  const trick = getTrickBySlug(slug);

  if (!trick) {
    notFound();
  }

  const difficultyColor = DIFFICULTY_COLORS[trick.difficultyLabel] || "bg-gray-100 text-gray-800";

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
          <span className="text-sm text-zen-text-secondary">比較台帳</span>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto px-4">
        {/* Trick Info */}
        <div className="py-6">
          <h1 className="heading-large text-zen-text-primary">
            {trick.nameJa}
            <span className="text-lg font-normal text-zen-text-secondary ml-2">
              {trick.nameEn}
            </span>
          </h1>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${difficultyColor}`}>
              {trick.difficultyLabel} ({trick.difficulty === 1 ? "Beginner" : trick.difficulty === 2 ? "Beginner" : trick.difficulty === 3 ? "Intermediate" : trick.difficulty === 4 ? "Advanced" : "Expert"})
            </span>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-zen-divider text-zen-text-secondary">
              {trick.attribute}
            </span>
          </div>
        </div>

        {/* Video Grid */}
        <div className="py-4">
          <VideoGrid videos={trick.videos} trickName={trick.nameJa} />
        </div>

        {/* Tips Button (Week 2) */}
        <div className="py-4">
          <button
            className="w-full py-3 px-4 bg-zen-card border border-zen-border rounded-xl flex items-center justify-center gap-2 text-zen-text-secondary hover:bg-zen-divider transition-colors"
            disabled
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            コツを見る（Tips）
            <span className="text-xs bg-zen-divider px-2 py-0.5 rounded-full">Coming Soon</span>
          </button>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-zen-card border-t border-zen-border safe-area-inset-bottom">
        <div className="max-w-md mx-auto px-4 py-3">
          <Link
            href={`/post/new?trick=${trick.slug}`}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            この技を投稿する
          </Link>
        </div>
      </div>
    </main>
  );
}
