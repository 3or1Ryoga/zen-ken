-- Migration 003: Create videos table

DO $$ BEGIN
  CREATE TYPE video_type_enum AS ENUM ('youtube', 'instagram', 'tiktok', 'upload');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trick_id UUID NOT NULL REFERENCES tricks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_type video_type_enum NOT NULL,
  thumbnail_url TEXT,
  comment TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_videos_trick_id ON videos(trick_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
