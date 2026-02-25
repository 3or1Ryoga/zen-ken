# 剣玉技辞典 Week 3 技術仕様書

## プロジェクト概要

**プロジェクト名:** Zen Kendama（剣玉技辞典）Week 3
**開発期間:** Week 3（5-7日間）
**目標:** 本番デプロイ + SEO強化 + 細部の品質改善

---

## Week 3 の主要目標

Week 2で構築したバックエンドを本番環境にデプロイし、
「けん玉 技」「けん玉 一覧」などのキーワードでGoogle上位表示を狙う。

1. **本番デプロイ**
   - フロントエンド → Vercel
   - Go API + PostgreSQL → Render

2. **SEO強化**
   - 技ページを検索エンジンが読みやすい構造に
   - sitemap.xml・robots.txt・OGP・JSON-LD

3. **デプロイ前の細部修正**
   - セキュリティ設定（本番用シークレット）
   - パフォーマンス最適化

---

## デプロイ構成

```
┌──────────────────────────────────────────────┐
│  ユーザー                                      │
└──────────────┬───────────────────────────────┘
               │ HTTPS
               ▼
┌──────────────────────────────────────────────┐
│  Vercel                                       │
│  Next.js 15 (App Router)                      │
│  URL: zen-kendama.vercel.app                  │
└──────────────┬───────────────────────────────┘
               │ HTTPS / REST API
               ▼
┌──────────────────────────────────────────────┐
│  Render                                       │
│  Go API (Gin)          PostgreSQL             │
│  Port: 8080            zen-ken DB             │
└──────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  AWS S3                                       │
│  動画・サムネイル保存（既存）                   │
│  Bucket: zen-kendama                          │
└──────────────────────────────────────────────┘
```

---

## Day 1-2: デプロイ前の細部修正

### 1. 環境変数・セキュリティ

| 変数 | 現在 | 本番で必要な対応 |
|---|---|---|
| `NEXTAUTH_SECRET` | 任意文字列 | `openssl rand -base64 32` で生成した強力なシークレット |
| `JWT_SECRET` (Go) | `dev-secret-please-change` | 同上、32文字以上のランダム文字列 |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | RenderのGo APIのURL |
| `DATABASE_URL` | ローカルPostgres | RenderのPostgreSQL接続URL |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://zen-kendama.vercel.app` |

### 2. Next.js 本番設定

- [ ] `next.config.js` に `images.domains` を追加（S3バケットのドメイン）
- [ ] 不要な `console.log` を削除
- [ ] エラーページ（`not-found.tsx`）の内容を確認・改善

### 3. Go API 本番設定

- [ ] `GIN_MODE=release` を環境変数に設定
- [ ] CORS設定をVercelのURLのみに限定
  ```go
  // 現在: 全オリジン許可
  // 本番: Vercel URL のみ許可
  AllowOrigins: []string{"https://zen-kendama.vercel.app"}
  ```
- [ ] ヘルスチェックエンドポイント `GET /health` の確認（Render が使用）

---

## Day 3-4: Render デプロイ（Go API + PostgreSQL）

### Step 1: PostgreSQL on Render

1. Render ダッシュボード → **New PostgreSQL**
2. 設定:
   - Name: `zen-ken-db`
   - Region: `Singapore` (日本に最も近い)
   - Plan: Free（開発） or Starter $7/月（本番）
3. 作成後、`DATABASE_URL` を控える

### Step 2: Go API on Render

1. Render ダッシュボード → **New Web Service**
2. GitHubリポジトリを連携
3. 設定:
   - Root Directory: `zen-ken/backend`
   - Runtime: `Go`
   - Build Command: `go build -o main .`
   - Start Command: `./main`
   - Region: `Singapore`
4. 環境変数を設定:
   ```
   DATABASE_URL=<RenderのPostgreSQL URL>
   JWT_SECRET=<生成した強力なシークレット>
   AWS_REGION=ap-northeast-1
   AWS_ACCESS_KEY_ID=<既存の値>
   AWS_SECRET_ACCESS_KEY=<既存の値>
   S3_BUCKET_NAME=zen-kendama
   PORT=8080
   GIN_MODE=release
   ```
5. デプロイ後のURL例: `https://zen-ken-api.onrender.com`

### Step 3: DBマイグレーション・シード

Renderの PostgreSQL に対してマイグレーションを実行:
```bash
# 接続URLをRenderのURLに変更してシード実行
DATABASE_URL=<Render URL> python3 backend/migrations/seed_tricks.py
```

---

## Day 4-5: Vercel デプロイ（Next.js）

### Step 1: Vercel プロジェクト作成

1. [vercel.com](https://vercel.com) → **New Project**
2. GitHubリポジトリを連携
3. Root Directory: `zen-ken`（monorepo構成の場合）
4. Framework Preset: **Next.js**（自動検出）

### Step 2: 環境変数設定

Vercel ダッシュボード → Settings → Environment Variables:

```
NEXTAUTH_URL=https://zen-kendama.vercel.app
NEXTAUTH_SECRET=<生成した強力なシークレット>
NEXT_PUBLIC_API_URL=https://zen-ken-api.onrender.com
GOOGLE_CLIENT_ID=<既存の値>
GOOGLE_CLIENT_SECRET=<既存の値>
AWS_ACCESS_KEY_ID=<既存の値>
AWS_SECRET_ACCESS_KEY=<既存の値>
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=zen-kendama
```

### Step 3: デプロイ確認チェックリスト

- [ ] ホームページで技30件が表示される
- [ ] 技詳細ページが動作する
- [ ] サインアップ・ログインが動作する
- [ ] `/post/new` に未ログインでアクセスするとリダイレクトされる

---

## Day 5-7: SEO強化

### ターゲットキーワード

| キーワード | 月間検索数（推定） | 競合 |
|---|---|---|
| けん玉 技 | 中 | 中 |
| けん玉 一覧 | 中 | 低 |
| けん玉 技 初心者 | 低 | 低 |
| けん玉 灯台 やり方 | 低 | 低 |
| けん玉 とめけん | 低 | 低 |

**戦略:** 技名単体（「灯台 けん玉」「とめけん やり方」）のロングテールキーワードで個別ページを上位表示させる。

### 1. sitemap.xml の実装

```
/app/sitemap.ts
```

全技ページのURLを動的に生成してGoogleに伝える:
```
https://zen-kendama.vercel.app/
https://zen-kendama.vercel.app/tricks/big-cup
https://zen-kendama.vercel.app/tricks/lighthouse
... (30ページ分)
```

### 2. robots.txt の実装

```
/app/robots.ts
```

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /post/

Sitemap: https://zen-kendama.vercel.app/sitemap.xml
```

### 3. OGP（Open Graph）設定強化

各技ページのメタデータを強化:

```typescript
// 技詳細ページ（既存の generateMetadata を強化）
export async function generateMetadata({ params }) {
  const trick = await getTrickBySlug(slug);
  return {
    title: `${trick.nameJa}（${trick.nameEn}）のやり方 - けん玉技辞典`,
    description: `けん玉の技「${trick.nameJa}」の解説。難易度${trick.difficultyLabel}。コツや実演動画を掲載。`,
    openGraph: {
      title: `${trick.nameJa} - けん玉技辞典`,
      description: `難易度: ${trick.difficultyLabel} / カテゴリ: ${trick.category}`,
      type: "article",
      url: `https://zen-kendama.vercel.app/tricks/${trick.slug}`,
    },
    // Google検索結果でのタイトル最適化
    alternates: {
      canonical: `https://zen-kendama.vercel.app/tricks/${trick.slug}`,
    },
  };
}
```

### 4. JSON-LD 構造化データ

技詳細ページに構造化データを追加することで、Googleリッチリザルトに表示される可能性が上がる:

```typescript
// 技ページに追加
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": `${trick.nameJa}（けん玉）のやり方`,
  "description": `けん玉の技「${trick.nameJa}」の解説`,
  "difficulty": trick.difficultyLabel,
};
```

### 5. ホームページの SEO 改善

現状: `"use client"` でSSRなし → Googleがコンテンツを読みにくい

対応:
- ホームページをServer Componentに変換し、初期データをSSRで返す
- Googleのクローラーが技一覧を直接読める状態にする

```
現在: クライアントで fetch → Googleには空のHTMLが見える
目標: サーバーで fetch → Googleには技30件入りのHTMLが見える
```

---

## 実装優先順位

### Must（Week 3で必須）

- [ ] 本番用シークレット生成・設定
- [ ] Go API CORS本番設定
- [ ] Render PostgreSQL + Go API デプロイ
- [ ] Vercel Next.js デプロイ
- [ ] 本番環境での全機能動作確認
- [ ] `sitemap.xml` 実装
- [ ] `robots.txt` 実装
- [ ] Google Search Console への登録・サイトマップ送信

### Should（できれば Week 3）

- [ ] OGP メタデータの強化（技ページのdescription改善）
- [ ] JSON-LD 構造化データ
- [ ] ホームページの Server Component 化（SSR化）

### Could（Week 4以降）

- [ ] カスタムドメイン取得・設定
- [ ] Google Analytics 導入
- [ ] パフォーマンス計測（Core Web Vitals）
- [ ] OGP画像の自動生成（`@vercel/og`）

---

## SEO効果が出るまでの目安

| フェーズ | 期間 | 内容 |
|---|---|---|
| インデックス登録 | デプロイ後 1〜2週間 | Googleがサイトを発見・登録 |
| 初期順位確認 | 1〜2ヶ月 | ロングテールKWで50〜100位に表示 |
| 上位表示 | 3〜6ヶ月 | コンテンツ充実で10〜30位へ |

**最速でインデックスさせる方法:**
デプロイ後すぐに Google Search Console でサイトマップを送信する。

---

## まとめ

Week 3のゴールは「動いているものを世界に公開し、Googleに見つけてもらう」こと。

**次のアクション（Week 3 開始時）:**
1. 本番用シークレットを生成
2. Renderでバックエンドをデプロイ
3. VercelでフロントエンドをデプロイしてURLを取得
4. Google Search Consoleに登録してサイトマップ送信
