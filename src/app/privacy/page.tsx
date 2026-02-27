import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー - Zen Kendama",
  description: "Zen Kendama（けん玉技辞典）のプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zen-bg pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zen-bg/95 backdrop-blur-sm border-b border-zen-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 hover:bg-zen-card rounded-lg transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-zen-text-primary" style={{ fontFamily: "'Noto Serif JP', serif" }}>
            プライバシーポリシー
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 text-zen-text-primary">

        <p className="text-sm text-zen-text-secondary">
          最終更新日：2026年2月26日
        </p>

        <p className="text-sm leading-relaxed text-zen-text-secondary">
          Zen Kendama（けん玉技辞典）（以下「本サービス」）は、ユーザーのプライバシーを尊重し、
          個人情報の保護に努めます。本ポリシーは、本サービスにおける個人情報の取り扱いについて説明します。
        </p>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold border-b border-zen-border pb-2">
            1. 収集する情報
          </h2>
          <p className="text-sm text-zen-text-secondary leading-relaxed">
            本サービスは、以下の情報を収集することがあります。
          </p>
          <ul className="text-sm text-zen-text-secondary space-y-1 pl-4 list-disc">
            <li>メールアドレス（アカウント登録時）</li>
            <li>ユーザー名（アカウント登録時）</li>
            <li>投稿された動画ファイルおよびそのメタデータ</li>
            <li>サービス利用状況（アクセスログ、操作履歴）</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold border-b border-zen-border pb-2">
            2. 情報の利用目的
          </h2>
          <ul className="text-sm text-zen-text-secondary space-y-1 pl-4 list-disc">
            <li>アカウントの作成・管理・認証</li>
            <li>けん玉技動画の投稿・閲覧・共有機能の提供</li>
            <li>サービスの改善および新機能の開発</li>
            <li>不正利用の防止およびセキュリティの確保</li>
            <li>サービスに関する重要なお知らせの送信</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold border-b border-zen-border pb-2">
            3. 第三者への提供
          </h2>
          <p className="text-sm text-zen-text-secondary leading-relaxed">
            本サービスは、以下の場合を除き、収集した個人情報を第三者に提供しません。
          </p>
          <ul className="text-sm text-zen-text-secondary space-y-1 pl-4 list-disc">
            <li>ユーザー本人の同意がある場合</li>
            <li>法令に基づく開示が必要な場合</li>
            <li>人の生命・身体・財産の保護のために必要な場合</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold border-b border-zen-border pb-2">
            4. 外部サービスの利用
          </h2>
          <p className="text-sm text-zen-text-secondary leading-relaxed">
            本サービスは以下の外部サービスを利用しています。各サービスのプライバシーポリシーもご確認ください。
          </p>
          <ul className="text-sm text-zen-text-secondary space-y-1 pl-4 list-disc">
            <li>Amazon Web Services（動画ファイルの保存）</li>
            <li>Vercel（フロントエンドのホスティング）</li>
            <li>Render（バックエンドのホスティング）</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold border-b border-zen-border pb-2">
            5. データの保管とセキュリティ
          </h2>
          <p className="text-sm text-zen-text-secondary leading-relaxed">
            収集した情報は暗号化された通信（HTTPS）で送受信し、適切なセキュリティ対策を施したサーバーで保管します。
            パスワードはbcryptによりハッシュ化して保存し、平文では保存しません。
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold border-b border-zen-border pb-2">
            6. ユーザーの権利
          </h2>
          <p className="text-sm text-zen-text-secondary leading-relaxed">
            ユーザーはいつでも自身のアカウント情報の確認・修正・削除を要求することができます。
            ご要望はお問い合わせよりご連絡ください。
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold border-b border-zen-border pb-2">
            7. Cookieについて
          </h2>
          <p className="text-sm text-zen-text-secondary leading-relaxed">
            本サービスはログイン状態の維持のためにCookie（セッションCookie）を使用します。
            ブラウザの設定によりCookieを無効にすることができますが、その場合一部の機能が利用できなくなります。
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold border-b border-zen-border pb-2">
            8. ポリシーの変更
          </h2>
          <p className="text-sm text-zen-text-secondary leading-relaxed">
            本ポリシーは必要に応じて改定することがあります。重要な変更がある場合はサービス上でお知らせします。
            最新のポリシーは本ページに掲載します。
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-3">
          <h2 className="text-base font-bold border-b border-zen-border pb-2">
            9. お問い合わせ
          </h2>
          <p className="text-sm text-zen-text-secondary leading-relaxed">
            個人情報の取り扱いに関するお問い合わせは、本サービスのGitHubリポジトリのIssueよりご連絡ください。
          </p>
        </section>

        <div className="pt-4 text-center">
          <Link
            href="/"
            className="text-sm text-zen-accent-red hover:underline"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
