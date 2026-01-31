import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zen-bg flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        {/* Kendama Icon */}
        <div className="w-24 h-32 mx-auto mb-6 opacity-50">
          <svg viewBox="0 0 80 130" className="w-full h-full">
            <circle cx="40" cy="25" r="20" fill="#E8DED0" stroke="#C4B8A8" strokeWidth="2"/>
            <path d="M40 45 Q30 60 35 80" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
            <ellipse cx="40" cy="85" rx="12" ry="8" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
            <rect x="35" y="85" width="10" height="35" rx="2" fill="#D4C4B0" stroke="#B8A890" strokeWidth="1.5"/>
          </svg>
        </div>

        <h1 className="heading-large text-zen-text-primary mb-2">
          404
        </h1>
        <p className="text-zen-text-secondary mb-6">
          お探しのページが見つかりませんでした
        </p>

        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          ホームに戻る
        </Link>
      </div>
    </main>
  );
}
