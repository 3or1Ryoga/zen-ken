"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (formData.password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setIsLoading(true);

    // Simulate API call (Week 1 mock)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In Week 1, just redirect to signin
    // In Week 2, this will connect to Go backend
    router.push("/auth/signin?registered=true");
  };

  return (
    <main className="min-h-screen bg-zen-bg flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-zen-text-primary" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              Zen Kendama
            </h1>
          </Link>
          <p className="text-sm text-zen-text-secondary mt-2">
            新規アカウント登録
          </p>
        </div>

        {/* Google Sign Up Button (Coming Soon) */}
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-zen-border rounded-xl text-zen-text-secondary cursor-not-allowed opacity-60 mb-4"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleで登録
          <span className="text-xs bg-zen-divider px-2 py-0.5 rounded-full">Coming Soon</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-zen-border" />
          <span className="text-sm text-zen-text-muted">または</span>
          <div className="flex-1 h-px bg-zen-border" />
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zen-text-secondary mb-2">
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="w-full px-4 py-3 bg-zen-card border border-zen-border rounded-xl text-zen-text-primary placeholder:text-zen-text-muted focus:outline-none focus:ring-2 focus:ring-zen-accent-wood/50 focus:border-zen-accent-wood transition-all"
              placeholder="kendama_master"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zen-text-secondary mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 bg-zen-card border border-zen-border rounded-xl text-zen-text-primary placeholder:text-zen-text-muted focus:outline-none focus:ring-2 focus:ring-zen-accent-wood/50 focus:border-zen-accent-wood transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zen-text-secondary mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-zen-card border border-zen-border rounded-xl text-zen-text-primary placeholder:text-zen-text-muted focus:outline-none focus:ring-2 focus:ring-zen-accent-wood/50 focus:border-zen-accent-wood transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zen-text-secondary mb-2">
              パスワード（確認）
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-3 bg-zen-card border border-zen-border rounded-xl text-zen-text-primary placeholder:text-zen-text-muted focus:outline-none focus:ring-2 focus:ring-zen-accent-wood/50 focus:border-zen-accent-wood transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                登録中...
              </>
            ) : (
              "アカウントを作成"
            )}
          </button>
        </form>

        {/* Terms Notice */}
        <p className="text-xs text-zen-text-muted text-center mt-4">
          登録することで、利用規約とプライバシーポリシーに同意したことになります。
        </p>

        {/* Sign In Link */}
        <p className="text-center text-sm text-zen-text-secondary mt-6">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/auth/signin" className="text-zen-accent-red font-medium hover:underline">
            ログイン
          </Link>
        </p>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-zen-text-muted hover:text-zen-text-secondary transition-colors">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
