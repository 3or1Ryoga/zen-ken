# 剣玉技辞典 Week 2 技術仕様書

## プロジェクト概要

**プロジェクト名:** Zen Kendama（剣玉技辞典）Week 2
**開発期間:** Week 2（5-7日間）
**目標:** バックエンドインフラの構築（PostgreSQL + Go REST API + AWS S3動画アップロード）

---

## Week 2 の主要目標

Week 1で構築したフロントエンドMVPに、以下のバックエンド機能を追加：

1. **データベース移行**
   - モックJSONデータからPostgreSQLへの移行
   - Go REST APIの実装

2. **動画アップロード機能**
   - AWS S3への直接アップロード
   - 60秒制限の強制

3. **本格的な認証システム**
   - NextAuth.js + JWT連携
   - ユーザー登録・ログイン・セッション管理

---

## 技術スタック

### バックエンド（新規）

- **言語:** Go 1.21+
- **Webフレームワーク:** Gin（または Echo）
- **データベース:** PostgreSQL 15
- **ORM:** GORM
- **認証:** JWT（NextAuth.jsと連携）
- **ストレージ:** AWS S3
- **動画処理:** FFmpeg（60秒チェック）
- **CORS:** cors middleware

### フロントエンド（Week 1から継続）

- **Framework:** Next.js 15 (App Router)
- **認証:** NextAuth.js（JWTモード）
- **API通信:** fetch API / Axios

### インフラ

- **フロントエンド:** Vercel
- **バックエンド:** AWS ECS（または Lambda）
- **データベース:** AWS RDS (PostgreSQL)
- **ストレージ:** AWS S3
- **環境変数:** AWS Secrets Manager / .env.local（開発時）

---

## データベース設計（PostgreSQL）

### ER図概要

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │───┐   │   tricks    │───┐   │   videos    │
│             │   │   │             │   │   │             │
└─────────────┘   │   └─────────────┘   │   └─────────────┘
                  │                     │
                  └─────────────────────┘
                  (user_id, trick_id)
```

### テーブル定義

#### 1. users テーブル

ユーザー情報を管理。

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255),  -- メールパスワード認証用（nullableでOAuth時はnull）
  avatar_url TEXT,
  provider VARCHAR(50) NOT NULL DEFAULT 'email', -- 'google' | 'email'
  provider_id VARCHAR(255),  -- GoogleのユーザーID等
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_provider_id UNIQUE (provider, provider_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
```

#### 2. tricks テーブル

剣玉の技マスターデータ。

```sql
CREATE TYPE category_enum AS ENUM (
  '大皿系', '小皿系', '中皿系', '灯台系',
  '飛行機系', 'とめけん系', '回転系', '糸技系'
);

CREATE TABLE tricks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,  -- URL用（例: "lighthouse"）
  name_ja VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  category category_enum NOT NULL,
  subcategory VARCHAR(100),  -- "Basic Catch", "Balance" 等
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  difficulty_label VARCHAR(50),  -- "初級", "中級" 等
  attribute VARCHAR(100),  -- "静止(Balance)", "回転(Rotation)" 等
  thumbnail_url TEXT,
  icon_url TEXT,
  tags TEXT[],  -- PostgreSQLの配列型
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tricks_category ON tricks(category);
CREATE INDEX idx_tricks_difficulty ON tricks(difficulty);
CREATE INDEX idx_tricks_slug ON tricks(slug);
```

#### 3. videos テーブル

ユーザーが投稿した動画データ。

```sql
CREATE TYPE video_type_enum AS ENUM ('youtube', 'instagram', 'tiktok', 'upload');

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trick_id UUID NOT NULL REFERENCES tricks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,  -- S3 URL or 外部動画URL
  video_type video_type_enum NOT NULL,
  thumbnail_url TEXT,  -- S3サムネイルURL
  comment TEXT,  -- 任意のコメント
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  duration_seconds INTEGER,  -- 動画の長さ（秒）
  file_size_bytes BIGINT,  -- ファイルサイズ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_videos_trick_id ON videos(trick_id);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
```

#### 4. likes テーブル（オプション・Week 2で実装するかは検討）

動画へのいいね機能（Week 2では見送る可能性あり）。

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_video_like UNIQUE (user_id, video_id)
);

CREATE INDEX idx_likes_video_id ON likes(video_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
```

---

## Go REST API 設計

### API エンドポイント一覧

#### 認証関連

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| POST | `/api/auth/register` | ユーザー新規登録 | 不要 |
| POST | `/api/auth/login` | ログイン（JWT発行） | 不要 |
| POST | `/api/auth/google` | Google OAuth認証 | 不要 |
| GET | `/api/auth/me` | 現在のユーザー情報取得 | 必要 |

#### 技（Tricks）関連

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/tricks` | 技一覧取得（フィルタ・ページング可） | 不要 |
| GET | `/api/tricks/:slug` | 技詳細取得 | 不要 |
| POST | `/api/tricks` | 新規技登録 | 必要 |
| PUT | `/api/tricks/:id` | 技情報更新 | 必要 |
| DELETE | `/api/tricks/:id` | 技削除 | 必要（管理者のみ） |

#### 動画（Videos）関連

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/videos` | 動画一覧取得 | 不要 |
| GET | `/api/videos/:id` | 動画詳細取得 | 不要 |
| GET | `/api/tricks/:slug/videos` | 特定技の動画一覧 | 不要 |
| POST | `/api/videos` | 動画投稿（メタデータ） | 必要 |
| POST | `/api/videos/upload-url` | S3署名付きURL取得 | 必要 |
| DELETE | `/api/videos/:id` | 動画削除 | 必要（投稿者のみ） |

#### ユーザー関連

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/users/:id` | ユーザープロフィール取得 | 不要 |
| PUT | `/api/users/:id` | プロフィール更新 | 必要（本人のみ） |
| GET | `/api/users/:id/videos` | ユーザーの投稿動画一覧 | 不要 |

---

## API レスポンス例

### GET /api/tricks

**リクエスト:**

```
GET /api/tricks?category=灯台系&difficulty=3&page=1&limit=20
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "tricks": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "slug": "lighthouse",
        "nameJa": "灯台",
        "nameEn": "Lighthouse",
        "category": "灯台系",
        "subcategory": "Balance",
        "difficulty": 3,
        "difficultyLabel": "中級",
        "attribute": "静止(Balance)",
        "thumbnailUrl": "https://s3.amazonaws.com/...",
        "iconUrl": "https://s3.amazonaws.com/...",
        "tags": ["中級者向け", "バランス技"],
        "videoCount": 12,
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### POST /api/videos/upload-url

**リクエスト:**

```json
{
  "filename": "lighthouse-video.mp4",
  "contentType": "video/mp4",
  "trickId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://zen-kendama.s3.amazonaws.com/videos/xxx?X-Amz-...",
    "videoId": "660e8400-e29b-41d4-a716-446655440001",
    "expiresIn": 3600
  }
}
```

### POST /api/videos

**リクエスト:**

```json
{
  "trickId": "550e8400-e29b-41d4-a716-446655440000",
  "videoUrl": "https://zen-kendama.s3.amazonaws.com/videos/xxx.mp4",
  "videoType": "upload",
  "comment": "初めて成功しました！",
  "durationSeconds": 45
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "video": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "trickId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "770e8400-e29b-41d4-a716-446655440002",
      "videoUrl": "https://zen-kendama.s3.amazonaws.com/videos/xxx.mp4",
      "thumbnailUrl": "https://zen-kendama.s3.amazonaws.com/thumbnails/xxx.jpg",
      "videoType": "upload",
      "comment": "初めて成功しました！",
      "views": 0,
      "likes": 0,
      "durationSeconds": 45,
      "createdAt": "2026-01-31T10:00:00Z"
    }
  }
}
```

---

## 動画アップロードフロー

### アーキテクチャ図

```
┌─────────────┐      1. 署名付きURL要求      ┌─────────────┐
│             │ ───────────────────────────> │             │
│  Next.js    │                              │   Go API    │
│  (Client)   │ <─────────────────────────── │             │
│             │      2. 署名付きURL返却       └─────────────┘
└─────────────┘                                      │
      │                                              │
      │                                              │ 3. S3署名付きURL生成
      │                                              ▼
      │                                        ┌─────────────┐
      │        4. 動画を直接アップロード        │   AWS S3    │
      └───────────────────────────────────────>│   Bucket    │
                                               └─────────────┘
      │
      │        5. アップロード完了通知
      │           + メタデータ保存要求
      └───────────────────────────────────────> Go API
                                                    │
                                                    ▼
                                              PostgreSQL
```

### 実装フロー

#### Step 1: 署名付きURL取得（クライアント）

```typescript
// Next.js: app/post/new/page.tsx

const handleVideoUpload = async (file: File) => {
  // 1. Go APIに署名付きURLをリクエスト
  const response = await fetch('/api/videos/upload-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      trickId: selectedTrickId
    })
  });

  const { uploadUrl, videoId } = await response.json();

  // 2. S3に直接アップロード（Go APIを経由しない）
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  // 3. アップロード完了をGo APIに通知
  await fetch('/api/videos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      videoId,
      trickId: selectedTrickId,
      videoUrl: `https://zen-kendama.s3.amazonaws.com/videos/${videoId}.mp4`,
      videoType: 'upload',
      comment: 'すごく難しかった！',
      durationSeconds: 45
    })
  });
};
```

#### Step 2: 署名付きURL生成（Go API）

```go
// backend/handlers/video_handler.go

package handlers

import (
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UploadURLRequest struct {
	Filename    string `json:"filename" binding:"required"`
	ContentType string `json:"contentType" binding:"required"`
	TrickID     string `json:"trickId" binding:"required"`
}

func (h *VideoHandler) GetUploadURL(c *gin.Context) {
	var req UploadURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// 認証済みユーザーを取得
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	// 一意のビデオIDを生成
	videoID := uuid.New().String()
	key := fmt.Sprintf("videos/%s/%s.mp4", userID, videoID)

	// S3署名付きURLを生成（15分間有効）
	presignedReq, _ := h.s3Client.PutObjectRequest(&s3.PutObjectInput{
		Bucket:      aws.String("zen-kendama"),
		Key:         aws.String(key),
		ContentType: aws.String(req.ContentType),
	})

	uploadURL, err := presignedReq.Presign(15 * time.Minute)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate upload URL"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"uploadUrl": uploadURL,
			"videoId":   videoID,
			"expiresIn": 900, // 15分
		},
	})
}
```

#### Step 3: 動画メタデータ保存（Go API）

```go
// backend/handlers/video_handler.go

type CreateVideoRequest struct {
	VideoID         string `json:"videoId" binding:"required"`
	TrickID         string `json:"trickId" binding:"required"`
	VideoURL        string `json:"videoUrl" binding:"required"`
	VideoType       string `json:"videoType" binding:"required"`
	Comment         string `json:"comment"`
	DurationSeconds int    `json:"durationSeconds"`
}

func (h *VideoHandler) CreateVideo(c *gin.Context) {
	var req CreateVideoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("userID")

	// 60秒制限チェック
	if req.DurationSeconds > 60 {
		c.JSON(400, gin.H{"error": "Video must be 60 seconds or less"})
		return
	}

	// データベースに保存
	video := models.Video{
		ID:              req.VideoID,
		TrickID:         req.TrickID,
		UserID:          userID,
		VideoURL:        req.VideoURL,
		VideoType:       req.VideoType,
		Comment:         req.Comment,
		DurationSeconds: req.DurationSeconds,
		Views:           0,
		Likes:           0,
	}

	if err := h.db.Create(&video).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to save video"})
		return
	}

	c.JSON(201, gin.H{
		"success": true,
		"data": gin.H{
			"video": video,
		},
	})
}
```

---

## 認証フロー（NextAuth.js + JWT）

### 認証アーキテクチャ

```
┌─────────────┐                    ┌─────────────┐
│  Next.js    │  1. NextAuth.js    │  Go API     │
│  (Client)   │     JWT発行         │             │
│             │ ──────────────────> │             │
└─────────────┘                    └─────────────┘
      │                                    │
      │  2. JWT付きAPIリクエスト            │
      └───────────────────────────────────>│
                                           │
                                           │ 3. JWT検証
                                           ▼
                                     PostgreSQL
```

### NextAuth.js 設定（フロントエンド）

```typescript
// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    CredentialsProvider({
      name: "Email/Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Go APIにログインリクエスト
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password
          })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.username,
            accessToken: data.data.token
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.id;
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### JWT検証ミドルウェア（Go API）

```go
// backend/middleware/auth.go

package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// "Bearer {token}" 形式
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// JWT検証
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// クレームからユーザーIDを取得
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("userID", claims["sub"])
			c.Next()
		} else {
			c.JSON(401, gin.H{"error": "Invalid token claims"})
			c.Abort()
		}
	}
}
```

---

## FFmpeg 動画処理

Week 2では、**60秒制限の強制**のみを実装します。

### 60秒チェック実装

```go
// backend/services/video_service.go

package services

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

// GetVideoDuration はFFmpegで動画の長さ（秒）を取得
func GetVideoDuration(filePath string) (int, error) {
	cmd := exec.Command(
		"ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		filePath,
	)

	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("failed to get video duration: %w", err)
	}

	durationStr := strings.TrimSpace(string(output))
	duration, err := strconv.ParseFloat(durationStr, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse duration: %w", err)
	}

	return int(duration), nil
}

// ValidateVideoDuration は動画が60秒以下かチェック
func ValidateVideoDuration(filePath string) error {
	duration, err := GetVideoDuration(filePath)
	if err != nil {
		return err
	}

	if duration > 60 {
		return fmt.Errorf("video duration (%d seconds) exceeds 60 seconds limit", duration)
	}

	return nil
}
```

### クライアント側での事前チェック（オプション）

```typescript
// Next.js: utils/videoValidator.ts

export const validateVideo = async (file: File): Promise<{ valid: boolean; duration?: number; error?: string }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.floor(video.duration);

      if (duration > 60) {
        resolve({ valid: false, error: `動画は60秒以内にしてください（現在: ${duration}秒）` });
      } else {
        resolve({ valid: true, duration });
      }
    };

    video.onerror = () => {
      resolve({ valid: false, error: '動画ファイルを読み込めませんでした' });
    };

    video.src = URL.createObjectURL(file);
  });
};
```

---

## 環境変数

### フロントエンド（.env.local）

```bash
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Go API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# Production
# NEXT_PUBLIC_API_URL=https://api.zen-kendama.com
```

### バックエンド（.env）

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/zen_kendama

# JWT
JWT_SECRET=your-jwt-secret-here

# AWS
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=zen-kendama

# Server
PORT=8080
GIN_MODE=release  # production時
```

---

## Go プロジェクト構造

```
backend/
├── main.go                    # エントリーポイント
├── go.mod
├── go.sum
├── config/
│   └── config.go              # 環境変数読み込み
├── models/
│   ├── user.go                # User モデル
│   ├── trick.go               # Trick モデル
│   └── video.go               # Video モデル
├── handlers/
│   ├── auth_handler.go        # 認証関連API
│   ├── trick_handler.go       # 技関連API
│   ├── video_handler.go       # 動画関連API
│   └── user_handler.go        # ユーザー関連API
├── middleware/
│   ├── auth.go                # JWT認証ミドルウェア
│   └── cors.go                # CORSミドルウェア
├── services/
│   ├── auth_service.go        # 認証ビジネスロジック
│   ├── video_service.go       # 動画処理（FFmpeg）
│   └── s3_service.go          # S3アップロード
├── database/
│   └── db.go                  # DB接続
└── migrations/
    ├── 001_create_users.sql
    ├── 002_create_tricks.sql
    └── 003_create_videos.sql
```

---

## 実装優先順位

### Day 1-2: 環境構築 + データベース設計

- [ ] PostgreSQL (AWS RDS) セットアップ
- [ ] Goプロジェクト初期化
- [ ] データベースマイグレーション実行
- [ ] GORM モデル定義
- [ ] モックデータをPostgreSQLにインポート

### Day 3-4: Go REST API実装

- [ ] 認証API（登録・ログイン・JWT発行）
- [ ] 技API（一覧・詳細・作成）
- [ ] 動画API（一覧・詳細・作成）
- [ ] JWT認証ミドルウェア
- [ ] CORS設定

### Day 5: 動画アップロード機能

- [ ] AWS S3セットアップ
- [ ] 署名付きURL生成API
- [ ] FFmpegインストール + 60秒チェック実装
- [ ] フロントエンドとの統合

### Day 6: NextAuth.js連携

- [ ] NextAuth.js JWT設定
- [ ] Go APIとの認証連携
- [ ] フロントエンドでのAPI呼び出し修正
- [ ] 保護されたルートの実装

### Day 7: 統合テスト + デプロイ

- [ ] E2Eテスト（投稿フロー）
- [ ] AWS ECS / Lambdaへのデプロイ
- [ ] Vercelデプロイ
- [ ] 本番環境での動作確認

---

## セキュリティ考慮事項

1. **CORS設定**
   - Next.jsのオリジンのみ許可
   - Credentials対応

2. **SQL Injection対策**
   - GORMのプリペアドステートメント使用

3. **XSS対策**
   - 入力値のサニタイゼーション
   - レスポンスヘッダーの設定

4. **認証・認可**
   - JWT有効期限設定（24時間）
   - リフレッシュトークン（Week 3以降）

5. **ファイルアップロード**
   - 動画形式制限（MP4, MOV, AVI のみ）
   - ファイルサイズ制限（100MB以下）
   - S3アクセス制御（Public Read）

---

## まとめ

Week 2では、Week 1で構築したフロントエンドに、堅牢なバックエンドインフラを構築します。

**次のアクション:**

1. AWS RDS PostgreSQLインスタンス作成
2. Goプロジェクトセットアップ
3. データベースマイグレーション実行
4. Claude Codeで段階的に実装 🚀

**Week 3への準備:**

- コミュニティ機能（いいね・コメント）
- ゲーミフィケーション（バッジシステム）
- SNSシェア機能
- リアルタイム通知
